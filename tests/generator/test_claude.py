import json
import os
from unittest.mock import MagicMock, patch

from condition_navigator.models import Condition, ConditionData, SectionMeta
from condition_navigator.generator.claude import generate_condition
from condition_navigator.generator.prompts import condition_prompt


IBS = Condition(id="ibs", name="Irritable Bowel Syndrome", aliases=["IBS"], parents=[], group_id="braingut")

MOCK_ALL_FIELDS = {
    "plain_summary": "A functional GI disorder.",
    "detailed_summary": "Involves gut-brain axis dysregulation affecting motility and sensation.",
    "prevalence": {"summary": "Common worldwide", "estimate": "~10% of the population", "notes": "Likely under-diagnosed"},
    "subgroups": [],
    "symptoms": [{"symptom": "bloating", "category": "digestive", "notes": None}],
    "self_assessment": {"key_patterns": [], "quick_checks": []},
    "testing": {"at_home": [], "clinical": []},
    "related_conditions": [],
    "symptom_management": {"strategies": [], "things_to_avoid": []},
    "sustainable_improvement": {"key_levers": [], "common_mistakes": []},
    "finding_help": {"specialists": [], "patient_communities": []},
    "learning_resources": [],
}


def _mock_message(content: dict) -> MagicMock:
    msg = MagicMock()
    msg.content = [MagicMock(text=json.dumps(content))]
    return msg


@patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
@patch("condition_navigator.generator.claude.anthropic.Anthropic")
def test_generate_condition_returns_data(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.return_value = _mock_message(MOCK_ALL_FIELDS)

    data = generate_condition(IBS)

    assert data.condition_id == "ibs"
    assert data.condition_name == "Irritable Bowel Syndrome"
    assert "plain_summary" in data.sections
    assert data.sections["plain_summary"] == "A functional GI disorder."
    assert data.sections["prevalence"]["estimate"] == "~10% of the population"


@patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
@patch("condition_navigator.generator.claude.anthropic.Anthropic")
def test_generate_condition_single_api_call(mock_anthropic_cls):
    """All fields are requested in one API call."""
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.return_value = _mock_message(MOCK_ALL_FIELDS)

    generate_condition(IBS)

    assert mock_client.messages.create.call_count == 1
    call_kwargs = mock_client.messages.create.call_args
    assert call_kwargs.kwargs["max_tokens"] == 16000


@patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
@patch("condition_navigator.generator.claude.anthropic.Anthropic")
def test_generate_condition_strips_markdown_fences(mock_anthropic_cls):
    """Claude sometimes wraps JSON in ```json ... ``` — should be handled."""
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client

    fenced = f"```json\n{json.dumps(MOCK_ALL_FIELDS)}\n```"
    msg = MagicMock()
    msg.content = [MagicMock(text=fenced)]
    mock_client.messages.create.return_value = msg

    data = generate_condition(IBS)
    assert data.sections["plain_summary"] == "A functional GI disorder."


@patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
@patch("condition_navigator.generator.claude.anthropic.Anthropic")
def test_generate_skips_when_nothing_to_regenerate(mock_anthropic_cls):
    """When existing meta covers every applicable section with the same model + hash,
    no API call is made and the existing data is returned untouched."""
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client

    # Compute the hashes the smart-regen logic would produce for IBS at sonnet.
    _, _, hashes = condition_prompt(IBS, new_model="claude-sonnet-4-6")
    existing = ConditionData(
        condition_id="ibs",
        condition_name="Irritable Bowel Syndrome",
        model="claude-sonnet-4-6",
        sections={k: f"existing-{k}" for k in hashes},
        section_meta={k: SectionMeta(model="claude-sonnet-4-6", prompt_hash=h) for k, h in hashes.items()},
    )

    result = generate_condition(IBS, model="claude-sonnet-4-6", existing=existing)

    assert mock_client.messages.create.call_count == 0
    assert result is existing  # exact same object — caller can detect no-op


@patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"})
@patch("condition_navigator.generator.claude.anthropic.Anthropic")
def test_generate_merge_preserves_unregenerated_sections(mock_anthropic_cls):
    """When --section is used, sections NOT named must keep their existing values, and
    section_meta is updated only for the regenerated keys."""
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    # Mock returns only the regenerated key.
    mock_client.messages.create.return_value = _mock_message({"plain_summary": "fresh summary"})

    _, _, hashes = condition_prompt(IBS, new_model="claude-haiku-4-5-20251001")
    existing = ConditionData(
        condition_id="ibs",
        condition_name="Irritable Bowel Syndrome",
        model="claude-haiku-4-5-20251001",
        sections={
            "plain_summary": "old summary",
            "detailed_summary": "old detailed",
            "symptom_patterns": {"patterns": [{"id": "diarrhea"}]},  # manual section — must persist
        },
        section_meta={
            "plain_summary": SectionMeta(model="claude-haiku-4-5-20251001", prompt_hash=hashes["plain_summary"]),
            "detailed_summary": SectionMeta(model="claude-haiku-4-5-20251001", prompt_hash=hashes["detailed_summary"]),
        },
    )

    result = generate_condition(
        IBS,
        model="claude-haiku-4-5-20251001",
        existing=existing,
        only_sections=["plain_summary"],
    )

    # Regenerated:
    assert result.sections["plain_summary"] == "fresh summary"
    assert result.section_meta["plain_summary"].prompt_hash == hashes["plain_summary"]
    # Untouched:
    assert result.sections["detailed_summary"] == "old detailed"
    assert result.section_meta["detailed_summary"].prompt_hash == hashes["detailed_summary"]
    # Manual section content preserved, no meta written:
    assert result.sections["symptom_patterns"] == {"patterns": [{"id": "diarrhea"}]}
    assert "symptom_patterns" not in result.section_meta
