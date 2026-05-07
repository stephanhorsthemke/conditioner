from pathlib import Path

import yaml

from condition_navigator.models import Condition, ConditionGraph, SubCondition


def _parse_sub_conditions(raw: list) -> list[SubCondition]:
    out: list[SubCondition] = []
    for entry in raw:
        if isinstance(entry, str):
            out.append(SubCondition(id=entry))
        else:
            out.append(SubCondition(**entry))
    return out


def load_graph(path: Path) -> ConditionGraph:
    """Load and validate the condition graph from a YAML file.

    Supports both the legacy group-first schema (groups → conditions) and the
    current flat schema (conditions list with optional group tag).  The flat
    schema is preferred; groups are an optional label-lookup dictionary.
    """
    raw = yaml.safe_load(path.read_text())
    conditions: list[Condition] = []

    if "conditions" in raw:
        # Flat schema: conditions list with optional `group` tag.
        group_labels: dict[str, str] = {
            gid: gdata["label"]
            for gid, gdata in (raw.get("groups") or {}).items()
        }

        for c in raw["conditions"]:
            group_id = c.get("group", "")
            group_label = group_labels.get(group_id, "")
            conditions.append(Condition(
                id=c["id"],
                name=c["label"],
                full_name=c.get("full_label", ""),
                group_id=group_id,
                group_label=group_label,
                aliases=c.get("aliases", []),
                diagnosis_type=c.get("diagnosis_type", "pathophysiological"),
                sub_conditions=_parse_sub_conditions(c.get("sub_conditions", [])),
            ))
            for sub in c.get("subtypes", []):
                conditions.append(Condition(
                    id=sub["id"],
                    name=sub["label"],
                    full_name=sub.get("full_label", ""),
                    group_id=group_id,
                    group_label=group_label,
                    aliases=sub.get("aliases", []),
                    parents=[c["id"]],
                    diagnosis_type=sub.get("diagnosis_type", c.get("diagnosis_type", "pathophysiological")),
                ))
    else:
        # Legacy group-first schema.
        for group in raw["groups"]:
            group_id = group["id"]
            group_label = group["label"]
            for c in group["conditions"]:
                conditions.append(Condition(
                    id=c["id"],
                    name=c["label"],
                    full_name=c.get("full_label", ""),
                    group_id=group_id,
                    group_label=group_label,
                    aliases=c.get("aliases", []),
                    diagnosis_type=c.get("diagnosis_type", "pathophysiological"),
                    sub_conditions=_parse_sub_conditions(c.get("sub_conditions", [])),
                ))
                for sub in c.get("subtypes", []):
                    conditions.append(Condition(
                        id=sub["id"],
                        name=sub["label"],
                        full_name=sub.get("full_label", ""),
                        group_id=group_id,
                        group_label=group_label,
                        aliases=sub.get("aliases", []),
                        parents=[c["id"]],
                        diagnosis_type=sub.get("diagnosis_type", c.get("diagnosis_type", "pathophysiological")),
                    ))

    print(f"Loaded {len(conditions)} conditions from {path}")
    return ConditionGraph(conditions=conditions)
