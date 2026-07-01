import json
from pathlib import Path

from condition_navigator.models import (
    Condition,
    ConditionData,
    StartingPoint,
    StartingPointData,
)


# ---- Conditions ------------------------------------------------------------


def condition_path(condition: Condition, output_dir: Path) -> Path:
    """Public alias for the storage path of a condition's data file."""
    return _path(condition, output_dir)


def _path(condition: Condition, output_dir: Path) -> Path:
    return output_dir / f"{condition.id}.json"


def save(data: ConditionData, condition: Condition, output_dir: Path) -> Path:
    """Save ConditionData as JSON to the appropriate path under output_dir."""
    path = _path(condition, output_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data.model_dump(mode="json"), indent=2))
    print(f"  Saved → {path}")
    return path


def load(condition: Condition, output_dir: Path) -> ConditionData | None:
    """Load previously generated ConditionData, or None if not found."""
    path = _path(condition, output_dir)
    if not path.exists():
        return None
    return ConditionData.model_validate_json(path.read_text())


# ---- Starting points -------------------------------------------------------


def starting_point_path(sp: StartingPoint, output_dir: Path) -> Path:
    return output_dir / "starting_points" / f"{sp.id}.json"


def save_starting_point(data: StartingPointData, sp: StartingPoint, output_dir: Path) -> Path:
    path = starting_point_path(sp, output_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data.model_dump(mode="json"), indent=2))
    print(f"  Saved → {path}")
    return path


def load_starting_point(sp: StartingPoint, output_dir: Path) -> StartingPointData | None:
    path = starting_point_path(sp, output_dir)
    if not path.exists():
        return None
    return StartingPointData.model_validate_json(path.read_text())
