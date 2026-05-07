import json
from pathlib import Path

import click

from condition_navigator.graph import load_graph
from condition_navigator.generator.claude import generate_condition, DEFAULT_MODEL
from condition_navigator.generator.signals import generate_signals
from condition_navigator import storage

DATA_DIR = Path(__file__).parent.parent.parent / "data"
CONDITIONS_FILE = DATA_DIR / "conditions.yaml"
GENERATED_DIR = DATA_DIR / "generated"


@click.group()
def cli() -> None:
    """Condition Navigator CLI."""


@cli.command()
def list() -> None:
    """List all conditions in the graph."""
    graph = load_graph(CONDITIONS_FILE)
    for c in graph.conditions:
        parents = f"  ← {', '.join(c.parents)}" if c.parents else ""
        click.echo(f"  {c.id:20s} {c.name}{parents}")


@cli.command()
@click.option("--id", "condition_ids", multiple=True, help="Condition ID to generate. Repeatable. Omit to generate all.")
@click.option("--model", default=DEFAULT_MODEL, show_default=True, help="Anthropic model ID to use for generation.")
@click.option("--force", is_flag=True, help="Regenerate every (non-manual) section, ignoring per-section meta.")
@click.option("--section", "sections", multiple=True, help="Regenerate only the named section(s). Repeatable. Mutually exclusive with --force.")
def generate(condition_ids: tuple[str, ...], model: str, force: bool, sections: tuple[str, ...]) -> None:
    """Generate data for all conditions (or a subset with one or more --id).

    Default behaviour is smart-regen: only sections whose prompt or model has changed since
    the last generation are re-requested. Use --force to regenerate everything (still
    respecting fields marked `manual: true` in condition.yaml), or --section to target
    specific sections.
    """
    if force and sections:
        raise click.UsageError("--force and --section are mutually exclusive.")

    graph = load_graph(CONDITIONS_FILE)

    if condition_ids:
        targets = []
        for cid in condition_ids:
            c = graph.by_id(cid)
            if c is None:
                raise click.ClickException(f"Unknown condition id: {cid}")
            targets.append(c)
    else:
        targets = graph.conditions

    only_sections = list(sections) if sections else None

    for condition in targets:
        existing = storage.load(condition, GENERATED_DIR)

        click.echo(f"Generating: {condition.name} ({condition.id})")
        data = generate_condition(
            condition,
            model=model,
            known_conditions=graph.conditions,
            existing=existing,
            force=force,
            only_sections=only_sections,
        )
        # Save only when something actually changed (avoids touching files for no-ops).
        if data is not existing:
            storage.save(data, condition, GENERATED_DIR)

    _write_index(graph.conditions)
    click.echo("Done.")


@cli.command("generate-signals")
@click.option("--id", "condition_ids", multiple=True, help="Parent condition ID. Repeatable. Omit to process all syndromic conditions.")
@click.option("--model", default=DEFAULT_MODEL, show_default=True, help="Anthropic model ID.")
@click.option("--force", is_flag=True, help="Ignore existing section_meta and regenerate.")
def generate_signals_cmd(condition_ids: tuple[str, ...], model: str, force: bool) -> None:
    """Generate horizontal relevance signals for sub-conditions of syndromic conditions."""
    graph = load_graph(CONDITIONS_FILE)

    if condition_ids:
        targets = []
        for cid in condition_ids:
            c = graph.by_id(cid)
            if c is None:
                raise click.ClickException(f"Unknown condition id: {cid}")
            if not c.sub_conditions:
                raise click.ClickException(f"Condition '{cid}' has no sub-conditions.")
            targets.append(c)
    else:
        targets = [c for c in graph.conditions if c.sub_conditions]

    for parent in targets:
        sub_conditions = [graph.by_id(sc.id) for sc in parent.sub_conditions]
        sub_conditions = [c for c in sub_conditions if c is not None]

        existing = storage.load(parent, GENERATED_DIR)
        click.echo(f"Generating signals: {parent.name} ({parent.id})")
        data = generate_signals(
            parent,
            sub_conditions,
            model=model,
            existing=existing,
            force=force,
        )
        if data is not existing:
            storage.save(data, parent, GENERATED_DIR)

    _write_index(graph.conditions)
    click.echo("Done.")


@cli.command("index")
def build_index() -> None:
    """Write data/generated/index.json listing all conditions and their data status."""
    graph = load_graph(CONDITIONS_FILE)
    _write_index(graph.conditions)
    click.echo("Index written.")


def _write_index(conditions) -> None:
    """Write index.json from a list of Condition objects."""
    entries = []
    for c in conditions:
        has_data = storage.condition_path(c, GENERATED_DIR).exists()
        entries.append({
            "id": c.id,
            "name": c.name,
            "full_name": c.full_name,
            "aliases": c.aliases,
            "group_id": c.group_id,
            "group_label": c.group_label,
            "parents": c.parents,
            "has_data": has_data,
            "diagnosis_type": c.diagnosis_type,
            "sub_conditions": [sc.model_dump() for sc in c.sub_conditions],
        })
    index_path = GENERATED_DIR / "index.json"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(entries, indent=2))
    click.echo(f"  Index → {index_path} ({len(entries)} conditions)")
