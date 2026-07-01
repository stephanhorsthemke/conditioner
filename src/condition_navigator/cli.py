import json
from pathlib import Path

import click

from condition_navigator.graph import load_graph
from condition_navigator.starting_points import load_starting_points, validate_against_graph
from condition_navigator.generator.claude import (
    generate_condition,
    generate_conditions_batch,
    DEFAULT_MODEL,
)
from condition_navigator.generator.signals import generate_signals
from condition_navigator import storage

DATA_DIR = Path(__file__).parent.parent.parent / "data"
CONDITIONS_FILE = DATA_DIR / "conditions.yaml"
STARTING_POINTS_FILE = DATA_DIR / "starting_points.yaml"
GENERATED_DIR = DATA_DIR / "generated"


@click.group()
def cli() -> None:
    """Condition Navigator CLI."""


@cli.command("list")
def list_conditions() -> None:
    """List all conditions in the graph."""
    graph = load_graph(CONDITIONS_FILE)
    for c in graph.conditions:
        parents = f"  ← {', '.join(c.parents)}" if c.parents else ""
        click.echo(f"  {c.id:20s} {c.name}{parents}")


@cli.command()
@click.option("--id", "condition_ids", multiple=True, help="Condition ID to generate. Repeatable. Omit to generate all.")
@click.option("--model", default=DEFAULT_MODEL, show_default=True, help="Anthropic model ID to use for generation.")
@click.option("--force", is_flag=True, help="Regenerate every section, ignoring per-section meta.")
@click.option("--section", "sections", multiple=True, help="Regenerate only the named section(s). Repeatable. Mutually exclusive with --force.")
@click.option("--batch", is_flag=True, help="Submit all conditions as one Anthropic Batch API call. ~50% cheaper; up to 24h SLA (usually minutes).")
@click.option("--poll-interval", type=int, default=30, show_default=True, help="Seconds between batch status polls (only used with --batch).")
def generate(
    condition_ids: tuple[str, ...],
    model: str,
    force: bool,
    sections: tuple[str, ...],
    batch: bool,
    poll_interval: int,
) -> None:
    """Generate data for all conditions (or a subset with one or more --id).

    Default behaviour is smart-regen: only sections whose prompt or model has changed since
    the last generation are re-requested. Use --force to regenerate everything, or --section
    to target specific sections.
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

    if batch:
        pairs = [(c, storage.load(c, GENERATED_DIR)) for c in targets]
        results = generate_conditions_batch(
            pairs,
            model=model,
            known_conditions=graph.conditions,
            force=force,
            only_sections=only_sections,
            poll_interval_seconds=poll_interval,
        )
        by_id = {c.id: c for c in targets}
        for cid, data in results.items():
            storage.save(data, by_id[cid], GENERATED_DIR)
    else:
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
@click.option("--starting-point", "sp_ids", multiple=True, help="Starting point ID. Repeatable. Omit to process all.")
@click.option("--model", default=DEFAULT_MODEL, show_default=True, help="Anthropic model ID.")
@click.option("--force", is_flag=True, help="Ignore existing section_meta and regenerate.")
def generate_signals_cmd(sp_ids: tuple[str, ...], model: str, force: bool) -> None:
    """Generate horizontal relevance signals for a starting point's sub-conditions."""
    graph = load_graph(CONDITIONS_FILE)
    starting_points = load_starting_points(STARTING_POINTS_FILE)

    if sp_ids:
        by_id = {sp.id: sp for sp in starting_points}
        targets = []
        for sp_id in sp_ids:
            sp = by_id.get(sp_id)
            if sp is None:
                raise click.ClickException(f"Unknown starting point: {sp_id}")
            if not sp.sub_conditions:
                raise click.ClickException(f"Starting point '{sp_id}' has no sub_conditions.")
            targets.append(sp)
    else:
        targets = [sp for sp in starting_points if sp.sub_conditions]

    for sp in targets:
        sub_conditions = [graph.by_id(sc.id) for sc in sp.sub_conditions]
        sub_conditions = [c for c in sub_conditions if c is not None]

        existing = storage.load_starting_point(sp, GENERATED_DIR)
        click.echo(f"Generating signals: {sp.label} ({sp.id})")
        data = generate_signals(
            sp,
            sub_conditions,
            model=model,
            existing=existing,
            force=force,
        )
        if data is not existing:
            storage.save_starting_point(data, sp, GENERATED_DIR)

    _write_starting_points_index(starting_points)
    click.echo("Done.")


@cli.command("index")
def build_index() -> None:
    """Write data/generated/index.json and data/generated/starting_points/index.json."""
    graph = load_graph(CONDITIONS_FILE)
    starting_points = load_starting_points(STARTING_POINTS_FILE)

    warnings = validate_against_graph(starting_points, graph)
    for w in warnings:
        click.echo(f"  ⚠ {w}", err=True)

    _write_index(graph.conditions)
    _write_starting_points_index(starting_points)
    click.echo("Index written.")


@cli.command("list-starting-points")
def list_starting_points() -> None:
    """List all starting points."""
    starting_points = load_starting_points(STARTING_POINTS_FILE)
    for sp in starting_points:
        kind_tag = f"[{sp.kind}]"
        n = len(sp.sub_conditions)
        click.echo(f"  {sp.id:15s} {kind_tag:12s} {sp.label}  ({n} sub-conditions)")


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
        })
    index_path = GENERATED_DIR / "index.json"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(entries, indent=2))
    click.echo(f"  Index → {index_path} ({len(entries)} conditions)")


def _write_starting_points_index(starting_points) -> None:
    """Write starting_points/index.json — the frontend uses this for /start/:id routing."""
    entries = []
    for sp in starting_points:
        sp_data_path = GENERATED_DIR / "starting_points" / f"{sp.id}.json"
        has_signals = sp_data_path.exists()
        entries.append({
            "id": sp.id,
            "label": sp.label,
            "full_label": sp.full_label,
            "kind": sp.kind,
            "condition_id": sp.condition_id,
            "intro": sp.intro,
            "symptom_patterns": [p.model_dump() for p in sp.symptom_patterns],
            "sub_conditions": [sc.model_dump() for sc in sp.sub_conditions],
            "has_signals": has_signals,
        })
    index_path = GENERATED_DIR / "starting_points" / "index.json"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(entries, indent=2))
    click.echo(f"  Starting-point index → {index_path} ({len(entries)} entries)")
