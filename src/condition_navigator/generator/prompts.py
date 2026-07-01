"""
Prompt builder for condition data generation.

Reads prompts/condition.yaml and builds a single (system, user) prompt tuple
that requests all fields for a given condition in one API call.
"""

import hashlib
import json
import re
from pathlib import Path

import yaml

from condition_navigator.models import Condition, ConditionData, model_family_rank

PROMPT_FILE = Path(__file__).parent.parent.parent.parent / "prompts" / "condition.yaml"

_FIELD_META_KEYS = {"prompt", "schema"}


def _is_field_wrapper(value: object) -> bool:
    if not isinstance(value, dict):
        return False
    keys = set(value.keys())
    return "schema" in keys and keys.issubset(_FIELD_META_KEYS)


def _extract_schema(value: object) -> object:
    """Recursively strip {prompt, schema} wrappers, keeping only the output shape."""
    if isinstance(value, dict):
        if _is_field_wrapper(value):
            return _extract_schema(value["schema"])
        return {k: _extract_schema(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_extract_schema(item) for item in value]
    return value


def section_prompt_hash(system: str, field_prompt: str, schema: object) -> str:
    """Stable short hash of (system + field_prompt + schema). Different inputs → different hash."""
    payload = system + "\n---\n" + field_prompt + "\n---\n" + json.dumps(schema, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def condition_prompt(
    condition: Condition,
    known_conditions: list[Condition] | None = None,
    existing: ConditionData | None = None,
    new_model: str = "",
    force: bool = False,
    only_sections: list[str] | None = None,
) -> tuple[str, str, dict[str, str]]:
    """Build the (system, user) prompt and a {section_name: prompt_hash} map for sections that will be regenerated.

    Smart-regen logic — a field is included unless `existing.section_meta[name]`
    already covers it with the same prompt_hash AND a model of equal-or-higher
    family rank.

    `force=True` skips the meta-based skip.
    `only_sections=[...]` keeps only those sections.

    Returns ("", "", {}) when nothing needs regenerating — the caller should skip the API call.
    """
    spec = yaml.safe_load(PROMPT_FILE.read_text())
    system = spec["system"]
    fields = spec["fields"]

    existing_meta = existing.section_meta if existing else {}

    # Decide which fields to include and compute their hashes.
    selected: dict[str, dict] = {}
    hashes: dict[str, str] = {}
    for name, field in fields.items():
        field_prompt = field["prompt"] if isinstance(field, dict) and "prompt" in field else ""
        schema = _extract_schema(field)
        h = section_prompt_hash(system, field_prompt, schema)

        if only_sections is not None:
            if name in only_sections:
                selected[name] = field
                hashes[name] = h
            continue

        if force:
            selected[name] = field
            hashes[name] = h
            continue

        meta = existing_meta.get(name)
        if meta is None:
            # No record — treat as stale (legacy migration).
            selected[name] = field
            hashes[name] = h
            continue
        if model_family_rank(new_model) > model_family_rank(meta.model):
            selected[name] = field
            hashes[name] = h
            continue
        if h != meta.prompt_hash:
            selected[name] = field
            hashes[name] = h
            continue
        # Otherwise: section is up to date, skip.

    if not selected:
        return "", "", {}

    schema = {name: _extract_schema(field) for name, field in selected.items()}

    # Interpolate the user prefix
    prefix = spec["user_prefix"].replace("{{condition_name}}", condition.name)
    if condition.aliases:
        aliases_str = ", ".join(condition.aliases)
        prefix = re.sub(r"\{\{#if aliases\}\}(.*?)\{\{/if\}\}", r"\1", prefix, flags=re.DOTALL)
        prefix = prefix.replace("{{aliases}}", aliases_str)
    else:
        prefix = re.sub(r"\{\{#if aliases\}\}.*?\{\{/if\}\}", "", prefix, flags=re.DOTALL)

    parts = [prefix]

    if known_conditions:
        catalog = [
            {"id": c.id, "name": c.name, "aliases": c.aliases}
            for c in known_conditions
            if c.id != condition.id
        ]
        parts.append(
            "LINKABLE CONDITIONS catalog — the small set of conditions for "
            "which the frontend has dedicated pages. This is a labeling "
            "reference, NOT a menu of related conditions to choose from. "
            "Generate `related_conditions` based on medical knowledge "
            "(comorbidity, mechanism, differential), independently of this "
            "catalog. Then, for each entry you generated, set `id` to the "
            "matching catalog id if its name or alias matches; otherwise "
            "leave `id` as null. Most entries will have id: null and that is "
            "expected.\n"
            + json.dumps(catalog, indent=2)
        )

    parts.append(json.dumps(schema, indent=2))
    user = "\n\n".join(parts)
    return system, user, hashes
