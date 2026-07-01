"""
Horizontal relevance-signal generator for starting points.

Generates per-starting-point distinguishing signals for all sub-conditions in
one API call, so the model can calibrate each signal against its peers.

Output is written as a separate `StartingPointData` file at
`data/generated/starting_points/<sp_id>.json`, so signals never mingle with
Condition data.
"""

import hashlib
import json
import os
from pathlib import Path

import anthropic
import yaml
from dotenv import load_dotenv

from condition_navigator.models import (
    Condition,
    SectionMeta,
    StartingPoint,
    StartingPointData,
    model_family_rank,
)

load_dotenv()

SIGNALS_PROMPT_FILE = Path(__file__).parent.parent.parent.parent / "prompts" / "signals.yaml"
SECTION_KEY = "sub_condition_signals"

DEFAULT_MODEL = "claude-haiku-4-5-20251001"


def _prompt_hash(system: str, user_template: str, sub_condition_ids: list[str]) -> str:
    payload = system + "\n---\n" + user_template + "\n---\n" + json.dumps(sorted(sub_condition_ids))
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def generate_signals(
    starting_point: StartingPoint,
    sub_conditions: list[Condition],
    model: str = DEFAULT_MODEL,
    existing: StartingPointData | None = None,
    force: bool = False,
) -> StartingPointData:
    """Generate parent-scoped relevance signals for a starting point's sub-conditions.

    Returns existing unchanged when the prompt hash and model family match.
    """
    if not sub_conditions:
        print("  No sub-conditions — nothing to generate.")
        return existing or StartingPointData(starting_point_id=starting_point.id)

    spec = yaml.safe_load(SIGNALS_PROMPT_FILE.read_text())
    system: str = spec["system"]
    user_template: str = spec["user_template"]

    sub_ids = [c.id for c in sub_conditions]
    h = _prompt_hash(system, user_template, sub_ids)

    if not force and existing is not None:
        meta = existing.section_meta.get(SECTION_KEY)
        if (
            meta is not None
            and meta.prompt_hash == h
            and model_family_rank(model) <= model_family_rank(meta.model)
        ):
            print("  Up to date — nothing to regenerate.")
            return existing

    conditions_json = json.dumps(
        [{"id": c.id, "name": c.name, "aliases": c.aliases} for c in sub_conditions],
        indent=2,
    )
    user = (
        user_template
        .replace("{{parent_name}}", starting_point.label)
        .replace("{{conditions_json}}", conditions_json)
    )

    print(f"  Generating {SECTION_KEY} for {len(sub_conditions)} sub-conditions with {model}…")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    message = client.messages.create(
        model=model,
        max_tokens=4096,
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    raw = message.content[0].text
    try:
        signals: dict[str, str] = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.index("{")
        signals, _ = json.JSONDecoder().raw_decode(raw, start)

    data = (
        existing.model_copy(deep=True)
        if existing
        else StartingPointData(starting_point_id=starting_point.id)
    )
    data.model = model
    data.sections[SECTION_KEY] = signals
    data.section_meta[SECTION_KEY] = SectionMeta(model=model, prompt_hash=h)

    print("  Done.")
    return data
