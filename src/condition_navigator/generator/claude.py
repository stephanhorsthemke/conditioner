import json
import os

import anthropic
from dotenv import load_dotenv

from condition_navigator.models import Condition, ConditionData, SectionMeta
from condition_navigator.generator.prompts import condition_prompt

load_dotenv()

DEFAULT_MODEL = "claude-haiku-4-5-20251001"


def generate_condition(
    condition: Condition,
    model: str = DEFAULT_MODEL,
    known_conditions: list[Condition] | None = None,
    existing: ConditionData | None = None,
    force: bool = False,
    only_sections: list[str] | None = None,
) -> ConditionData:
    """Smart-regen one condition.

    - Skips fields marked `manual: true` in condition.yaml.
    - Skips fields whose prompt_hash and model family rank match `existing.section_meta`.
    - Returns the existing data unchanged when nothing needs regenerating.
    - Merges the API response into existing sections (does not destroy unrelated data).
    """
    system, user, hashes = condition_prompt(
        condition,
        known_conditions=known_conditions,
        existing=existing,
        new_model=model,
        force=force,
        only_sections=only_sections,
    )

    if not hashes:
        print("  Up to date — nothing to regenerate.")
        return existing or ConditionData(
            condition_id=condition.id, condition_name=condition.name, model=model
        )

    section_names = ", ".join(sorted(hashes))
    print(f"  Regenerating {len(hashes)} section(s) with {model}: {section_names}")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    message = client.messages.create(
        model=model,
        max_tokens=16000,
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    raw = message.content[0].text
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Model may wrap JSON in markdown fences or add surrounding text.
        # raw_decode parses exactly one JSON value from the first `{` and ignores the rest.
        start = raw.index("{")
        parsed, _ = json.JSONDecoder().raw_decode(raw, start)

    # Start from existing data; overwrite only the regenerated keys.
    data = (existing.model_copy(deep=True) if existing else
            ConditionData(condition_id=condition.id, condition_name=condition.name))
    data.model = model

    for key, value in parsed.items():
        if key not in hashes:
            # Model returned a key we didn't ask for — ignore it.
            continue
        data.sections[key] = value
        data.section_meta[key] = SectionMeta(model=model, prompt_hash=hashes[key])

    sub_ids = {sc.id for sc in condition.sub_conditions}
    if sub_ids and isinstance(data.sections.get("related_conditions"), list):
        before = len(data.sections["related_conditions"])
        data.sections["related_conditions"] = [
            rc for rc in data.sections["related_conditions"]
            if not (isinstance(rc, dict) and rc.get("id") in sub_ids)
        ]
        dropped = before - len(data.sections["related_conditions"])
        if dropped:
            print(f"  Filtered {dropped} related_conditions entry/entries that overlapped sub_conditions.")

    print("  Done.")
    return data
