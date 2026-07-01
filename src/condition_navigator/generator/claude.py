import json
import os
import time

import anthropic
from dotenv import load_dotenv

from condition_navigator.models import Condition, ConditionData, SectionMeta
from condition_navigator.generator.prompts import condition_prompt

load_dotenv()

DEFAULT_MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 16000


# ---- Shared helpers -------------------------------------------------------


def _prepare_request(
    condition: Condition,
    model: str,
    known_conditions: list[Condition] | None,
    existing: ConditionData | None,
    force: bool,
    only_sections: list[str] | None,
) -> tuple[str, str, dict[str, str]] | None:
    """Build (system, user, hashes) for a condition, or None if nothing to regenerate."""
    system, user, hashes = condition_prompt(
        condition,
        known_conditions=known_conditions,
        existing=existing,
        new_model=model,
        force=force,
        only_sections=only_sections,
    )
    if not hashes:
        return None
    return system, user, hashes


def _extract_json_object(raw: str) -> dict:
    """Extract a JSON object from a raw model response.

    Handles: pure JSON, markdown code fences, and prose-wrapped JSON. Scans
    from each `{` in the text and returns the first one that parses as a valid
    JSON value; raises if none does.
    """
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    decoder = json.JSONDecoder()
    for i, ch in enumerate(raw):
        if ch != "{":
            continue
        try:
            obj, _ = decoder.raw_decode(raw, i)
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            continue
    raise ValueError(f"Could not extract JSON object from response (first 300 chars): {raw[:300]!r}")


def _apply_response(
    condition: Condition,
    existing: ConditionData | None,
    model: str,
    hashes: dict[str, str],
    raw_text: str,
) -> ConditionData:
    """Parse one Claude JSON response and merge it into existing ConditionData."""
    parsed = _extract_json_object(raw_text)

    data = (
        existing.model_copy(deep=True) if existing
        else ConditionData(condition_id=condition.id, condition_name=condition.name)
    )
    data.model = model
    for key, value in parsed.items():
        if key not in hashes:
            # Model returned a key we didn't ask for — ignore it.
            continue
        data.sections[key] = value
        data.section_meta[key] = SectionMeta(model=model, prompt_hash=hashes[key])
    return data


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


# ---- Sync path -------------------------------------------------------------


def generate_condition(
    condition: Condition,
    model: str = DEFAULT_MODEL,
    known_conditions: list[Condition] | None = None,
    existing: ConditionData | None = None,
    force: bool = False,
    only_sections: list[str] | None = None,
) -> ConditionData:
    """Smart-regen one condition via the sync Messages API.

    - Skips fields whose prompt_hash and model family rank match `existing.section_meta`.
    - Returns the existing data unchanged when nothing needs regenerating.
    - Merges the API response into existing sections (does not destroy unrelated data).
    """
    prepared = _prepare_request(condition, model, known_conditions, existing, force, only_sections)
    if prepared is None:
        print("  Up to date — nothing to regenerate.")
        return existing or ConditionData(
            condition_id=condition.id, condition_name=condition.name, model=model
        )

    system, user, hashes = prepared
    section_names = ", ".join(sorted(hashes))
    print(f"  Regenerating {len(hashes)} section(s) with {model}: {section_names}")

    message = _client().messages.create(
        model=model,
        max_tokens=MAX_TOKENS,
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    data = _apply_response(condition, existing, model, hashes, message.content[0].text)
    print("  Done.")
    return data


# ---- Batch path ------------------------------------------------------------


def generate_conditions_batch(
    targets: list[tuple[Condition, ConditionData | None]],
    model: str = DEFAULT_MODEL,
    known_conditions: list[Condition] | None = None,
    force: bool = False,
    only_sections: list[str] | None = None,
    poll_interval_seconds: int = 30,
) -> dict[str, ConditionData]:
    """Submit all targets in one Batch API call (50% cheaper, up to 24h SLA).

    - Runs the same smart-regen filter before submission — up-to-date conditions are skipped.
    - Blocks until the batch ends, polling every `poll_interval_seconds`.
    - Returns {condition_id: ConditionData} for conditions the model successfully regenerated.
    - Errored / expired / canceled requests are logged and dropped.
    """
    prepared: dict[str, tuple[Condition, ConditionData | None, str, str, dict[str, str]]] = {}
    for condition, existing in targets:
        p = _prepare_request(condition, model, known_conditions, existing, force, only_sections)
        if p is None:
            print(f"  {condition.id}: up to date — skipping")
            continue
        system, user, hashes = p
        prepared[condition.id] = (condition, existing, system, user, hashes)

    if not prepared:
        print("Nothing to regenerate.")
        return {}

    print(f"Submitting batch: {len(prepared)} conditions with {model}")

    requests = [
        {
            "custom_id": cid,
            "params": {
                "model": model,
                "max_tokens": MAX_TOKENS,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            },
        }
        for cid, (_, _, system, user, _) in prepared.items()
    ]

    client = _client()
    batch = client.messages.batches.create(requests=requests)
    print(f"  Batch id: {batch.id}")
    print(f"  Polling every {poll_interval_seconds}s. Usual latency: minutes; SLA: 24h.")

    start_time = time.time()
    while True:
        batch = client.messages.batches.retrieve(batch.id)
        counts = batch.request_counts
        elapsed = int(time.time() - start_time)
        print(
            f"  [{elapsed:>4}s] status={batch.processing_status} "
            f"succeeded={counts.succeeded} errored={counts.errored} "
            f"processing={counts.processing} expired={counts.expired}"
        )
        if batch.processing_status == "ended":
            break
        time.sleep(poll_interval_seconds)

    out: dict[str, ConditionData] = {}
    for result in client.messages.batches.results(batch.id):
        cid = result.custom_id
        entry = prepared.get(cid)
        if entry is None:
            print(f"  ⚠ Batch returned unknown custom_id: {cid}")
            continue
        condition, existing, _system, _user, hashes = entry
        rtype = result.result.type
        if rtype == "succeeded":
            raw = result.result.message.content[0].text
            try:
                out[cid] = _apply_response(condition, existing, model, hashes, raw)
            except (ValueError, json.JSONDecodeError) as e:
                print(f"  ✗ {cid}: response parse failed — {e}")
        elif rtype == "errored":
            inner = result.result.error.error
            print(f"  ✗ {cid}: errored — {inner.type}: {inner.message}")
        else:
            print(f"  ✗ {cid}: {rtype}")

    print(f"Done. {len(out)} condition(s) regenerated.")
    return out
