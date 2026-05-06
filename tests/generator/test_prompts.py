import json

from condition_navigator.generator.prompts import (
    _extract_schema,
    condition_prompt,
    section_prompt_hash,
)
from condition_navigator.models import Condition, ConditionData, SectionMeta


def test_extract_schema_strips_top_level_wrapper():
    assert _extract_schema({"prompt": "do this", "schema": ["string"]}) == ["string"]


def test_extract_schema_strips_nested_wrappers():
    raw = {
        "key_patterns": {"prompt": "find patterns", "schema": ["string"]},
        "at_home": {"prompt": "do checks", "schema": [{"name": "string", "description": "string"}]},
    }
    assert _extract_schema(raw) == {
        "key_patterns": ["string"],
        "at_home": [{"name": "string", "description": "string"}],
    }


def test_extract_schema_leaves_plain_dicts_intact():
    plain = {"name": "string", "type": "gold_standard | standard"}
    assert _extract_schema(plain) == plain


def test_condition_prompt_schema_has_no_prompt_keys():
    """The user message sent to Claude must not contain any 'prompt' annotation keys."""
    condition = Condition(id="test", name="Test Condition", group_id="immune")
    _, user, _ = condition_prompt(condition)
    json_start = user.rindex("\n\n") + 2
    schema = json.loads(user[json_start:])

    def has_wrapper(val):
        if isinstance(val, dict):
            if "prompt" in val and "schema" in val:
                return True
            return any(has_wrapper(v) for v in val.values())
        if isinstance(val, list):
            return any(has_wrapper(item) for item in val)
        return False
    assert not has_wrapper(schema), "Schema sent to Claude still contains prompt/schema wrappers"


CATALOG_HEADER = "labeling reference, NOT a menu"


def test_condition_prompt_injects_known_conditions_excluding_self():
    target = Condition(id="ibs", name="IBS", group_id="braingut")
    others = [
        Condition(id="histamine", name="Histamine intolerance", aliases=["HIT"], group_id="immune"),
        Condition(id="sibo", name="SIBO", aliases=["Small intestinal bacterial overgrowth"], group_id="microbial"),
        target,
    ]
    _, user, _ = condition_prompt(target, known_conditions=others)
    assert CATALOG_HEADER in user
    assert '"id": "histamine"' in user
    assert '"id": "sibo"' in user
    catalog_start = user.index(CATALOG_HEADER)
    catalog_end = user.index("\n\n", catalog_start)
    catalog_block = user[catalog_start:catalog_end]
    assert '"id": "ibs"' not in catalog_block, "the condition being generated must not appear in its own catalog"


def test_condition_prompt_omits_catalog_when_no_known_conditions():
    condition = Condition(id="solo", name="Solo Condition", group_id="immune")
    _, user, _ = condition_prompt(condition)
    assert CATALOG_HEADER not in user


# --- New: prompt hash + manual + smart-regen ---


def test_section_prompt_hash_stable_for_same_input():
    a = section_prompt_hash("sys", "field prompt", {"x": "string"})
    b = section_prompt_hash("sys", "field prompt", {"x": "string"})
    assert a == b


def test_section_prompt_hash_changes_when_any_input_changes():
    base = section_prompt_hash("sys", "fp", {"x": "string"})
    assert section_prompt_hash("sys2", "fp", {"x": "string"}) != base
    assert section_prompt_hash("sys", "fp2", {"x": "string"}) != base
    assert section_prompt_hash("sys", "fp", {"x": "string", "y": "string"}) != base


def test_manual_fields_excluded_from_schema_and_no_hash():
    """symptom_patterns is manual: true. For a syndromic condition (descriptive_only fields apply),
    it must not appear in the user prompt schema or in the returned hashes."""
    target = Condition(
        id="ibs",
        name="IBS",
        diagnosis_type="syndromic",
        sub_conditions=[],  # not strictly needed; descriptive_only also gates on this
    )
    # Force a descriptive condition by giving it a sub_condition.
    target.sub_conditions = [__import__("condition_navigator.models", fromlist=["SubCondition"]).SubCondition(id="lactase")]
    _, user, hashes = condition_prompt(target)
    assert "symptom_patterns" not in hashes
    assert "symptom_patterns" not in user


def test_smart_regen_skips_unchanged_sections():
    """A section whose prompt_hash matches existing meta and whose model is the same family rank
    is excluded from the prompt and the returned hashes."""
    target = Condition(id="ibs", name="IBS")
    # First pass: no existing — hashes contain every applicable field.
    _, _, first_hashes = condition_prompt(target, new_model="claude-sonnet-4-6")
    assert first_hashes, "expected some sections on the first pass"

    # Build existing data claiming those sections were generated with sonnet at the current hash.
    existing = ConditionData(
        condition_id="ibs",
        condition_name="IBS",
        section_meta={
            name: SectionMeta(model="claude-sonnet-4-6", prompt_hash=h)
            for name, h in first_hashes.items()
        },
    )
    # Second pass with the same model — nothing should regenerate.
    _, user, second_hashes = condition_prompt(target, existing=existing, new_model="claude-sonnet-4-6")
    assert second_hashes == {}
    assert user == ""


def test_smart_regen_triggers_on_cross_family_upgrade():
    target = Condition(id="ibs", name="IBS")
    _, _, hashes_haiku = condition_prompt(target, new_model="claude-haiku-4-5-20251001")
    existing = ConditionData(
        condition_id="ibs",
        condition_name="IBS",
        section_meta={
            name: SectionMeta(model="claude-haiku-4-5-20251001", prompt_hash=h)
            for name, h in hashes_haiku.items()
        },
    )
    # Upgrade haiku → opus: every section should regenerate.
    _, _, hashes_opus = condition_prompt(target, existing=existing, new_model="claude-opus-4-7")
    assert set(hashes_opus.keys()) == set(hashes_haiku.keys())


def test_smart_regen_skips_on_downgrade():
    target = Condition(id="ibs", name="IBS")
    _, _, hashes = condition_prompt(target, new_model="claude-sonnet-4-6")
    existing = ConditionData(
        condition_id="ibs",
        condition_name="IBS",
        section_meta={
            name: SectionMeta(model="claude-sonnet-4-6", prompt_hash=h)
            for name, h in hashes.items()
        },
    )
    # Downgrade sonnet → haiku: nothing regenerates (preserve the better output).
    _, _, regen = condition_prompt(target, existing=existing, new_model="claude-haiku-4-5-20251001")
    assert regen == {}


def test_force_regenerates_everything_except_manual():
    target = Condition(id="ibs", name="IBS")
    _, _, hashes = condition_prompt(target, new_model="claude-sonnet-4-6")
    existing = ConditionData(
        condition_id="ibs",
        condition_name="IBS",
        section_meta={
            name: SectionMeta(model="claude-sonnet-4-6", prompt_hash=h)
            for name, h in hashes.items()
        },
    )
    _, _, regen = condition_prompt(target, existing=existing, new_model="claude-sonnet-4-6", force=True)
    # Force regenerates everything — but symptom_patterns is manual and must still be excluded.
    assert "symptom_patterns" not in regen
    assert set(regen.keys()) == set(hashes.keys())


def test_only_sections_filter():
    target = Condition(id="ibs", name="IBS")
    _, _, all_hashes = condition_prompt(target, new_model="claude-sonnet-4-6")
    assert "plain_summary" in all_hashes  # sanity

    _, _, only = condition_prompt(target, new_model="claude-sonnet-4-6", only_sections=["plain_summary"])
    assert set(only.keys()) == {"plain_summary"}

    # Asking for a manual section explicitly is still ignored.
    _, _, mixed = condition_prompt(
        target,
        new_model="claude-sonnet-4-6",
        only_sections=["plain_summary", "symptom_patterns"],
    )
    assert set(mixed.keys()) == {"plain_summary"}
