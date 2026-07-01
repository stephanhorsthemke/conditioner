from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


DiagnosisType = Literal["syndromic", "pathophysiological", "aetiological", "constitutional", "masquerader"]

StartingPointKind = Literal["syndrome", "symptom"]


class Condition(BaseModel):
    id: str
    name: str
    full_name: str = ""
    group_id: str = ""
    group_label: str = ""
    aliases: list[str] = Field(default_factory=list)
    parents: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    diagnosis_type: DiagnosisType = "pathophysiological"


class ConditionGraph(BaseModel):
    conditions: list[Condition]

    def by_id(self, condition_id: str) -> Condition | None:
        return next((c for c in self.conditions if c.id == condition_id), None)

    def children_of(self, condition_id: str) -> list[Condition]:
        return [c for c in self.conditions if condition_id in c.parents]

    def roots(self) -> list[Condition]:
        return [c for c in self.conditions if not c.parents]


class SymptomPattern(BaseModel):
    id: str
    label: str
    description: str = ""


class SubConditionRef(BaseModel):
    id: str
    probability: int = 1
    patterns: list[str] = Field(default_factory=list)

    @field_validator("probability")
    @classmethod
    def _clamp(cls, v: int) -> int:
        return max(1, min(5, v))


class StartingPoint(BaseModel):
    id: str
    label: str
    full_label: str = ""
    kind: StartingPointKind
    # For kind=syndrome: id of the Condition whose page users can drill into for
    # the full biology/testing/management content. None for kind=symptom.
    condition_id: str | None = None
    intro: str = ""
    symptom_patterns: list[SymptomPattern] = Field(default_factory=list)
    sub_conditions: list[SubConditionRef] = Field(default_factory=list)


class GeneratedSection(BaseModel):
    """A single prompt's output, keyed by section name."""
    name: str
    content: dict[str, Any]


class SectionMeta(BaseModel):
    """Per-section provenance: what generated it, so we can decide whether to regenerate."""
    model: str
    prompt_hash: str


def model_family_rank(model: str) -> int:
    """Rank a model by family — opus > sonnet > haiku > unknown.

    Substring match so new dot-releases (sonnet-4-7, etc.) inherit the family
    automatically without code changes.
    """
    m = (model or "").lower()
    if "opus" in m:
        return 3
    if "sonnet" in m:
        return 2
    if "haiku" in m:
        return 1
    return 0


class ConditionData(BaseModel):
    """Full generated output for one condition."""
    condition_id: str
    condition_name: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model: str = ""
    sections: dict[str, Any] = Field(default_factory=dict)
    section_meta: dict[str, SectionMeta] = Field(default_factory=dict)


class StartingPointData(BaseModel):
    """Generated output attached to a starting point (currently just sub_condition_signals)."""
    starting_point_id: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    model: str = ""
    sections: dict[str, Any] = Field(default_factory=dict)
    section_meta: dict[str, SectionMeta] = Field(default_factory=dict)
