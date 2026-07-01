from pathlib import Path

import yaml

from condition_navigator.models import (
    ConditionGraph,
    StartingPoint,
    SubConditionRef,
    SymptomPattern,
)


def load_starting_points(path: Path) -> list[StartingPoint]:
    """Load and validate starting_points.yaml.

    A starting point is a curated view over the condition graph — a landing
    page presenting a candidate list of sub-conditions to investigate.
    Distinct from a Condition: no biology/testing/management fields of its own.
    """
    raw = yaml.safe_load(path.read_text()) or {}
    entries = raw.get("starting_points", [])

    out: list[StartingPoint] = []
    for e in entries:
        patterns = [SymptomPattern(**p) for p in e.get("symptom_patterns", [])]
        sub_conditions = [SubConditionRef(**sc) for sc in e.get("sub_conditions", [])]
        out.append(StartingPoint(
            id=e["id"],
            label=e["label"],
            full_label=e.get("full_label", ""),
            kind=e["kind"],
            condition_id=e.get("condition_id"),
            intro=e.get("intro", ""),
            symptom_patterns=patterns,
            sub_conditions=sub_conditions,
        ))

    print(f"Loaded {len(out)} starting points from {path}")
    return out


def validate_against_graph(
    starting_points: list[StartingPoint], graph: ConditionGraph
) -> list[str]:
    """Return a list of warning strings for any starting-point references that don't resolve.

    Warnings, not errors — the frontend is tolerant of unknown ids (it just
    won't render a row for them), so this is advisory.
    """
    warnings: list[str] = []
    for sp in starting_points:
        if sp.condition_id and graph.by_id(sp.condition_id) is None:
            warnings.append(
                f"starting_point '{sp.id}': condition_id '{sp.condition_id}' not found in graph"
            )
        pattern_ids = {p.id for p in sp.symptom_patterns}
        for sc in sp.sub_conditions:
            if graph.by_id(sc.id) is None:
                warnings.append(
                    f"starting_point '{sp.id}': sub_condition '{sc.id}' not found in graph"
                )
            for p in sc.patterns:
                if p not in pattern_ids:
                    warnings.append(
                        f"starting_point '{sp.id}': sub_condition '{sc.id}' references unknown pattern '{p}'"
                    )
    return warnings
