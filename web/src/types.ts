export type DiagnosisType = "syndromic" | "pathophysiological" | "aetiological" | "constitutional" | "masquerader";

export interface SubConditionRef {
  id: string;
  probability: number;
}

export interface ConditionIndex {
  id: string;
  name: string;
  full_name?: string;
  aliases: string[];
  group_id: string;
  group_label: string;
  parents: string[];
  has_data: boolean;
  diagnosis_type?: DiagnosisType;
  sub_conditions?: SubConditionRef[];
}

export type SpaceInclude = "all" | string[] | { groups: string[] };

export interface Space {
  id: string;
  label: string;
  description?: string;
  include: SpaceInclude;
  exclude?: string[];
}

export interface SpacesConfig {
  spaces: Space[];
}

export interface Prevalence {
  summary: string;
  estimate: string;
  notes: string;
}

export interface Subgroup {
  name: string;
  description: string;
  distinguishing_features: string[];
}

export interface Symptom {
  symptom: string;
  category: string;
  notes: string | null;
}

export interface AtHomeTest {
  name: string;
  description: string;
  safety_notes: string;
}

export interface ClinicalTest {
  name: string;
  type: "gold_standard" | "standard" | "emerging";
  description: string;
  availability: string;
}

export interface Testing {
  key_patterns: string[];
  at_home: AtHomeTest[];
  clinical: ClinicalTest[];
}

export interface RelatedCondition {
  id?: string | null;
  name: string;
  relationship: string;
  explanation: string;
}

export interface ManagementStrategy {
  name: string;
  category: string;
  description: string;
  evidence_level: "strong" | "moderate" | "anecdotal";
  notes: string | null;
}

export interface SymptomManagement {
  strategies: ManagementStrategy[];
  things_to_avoid: string[];
}

export interface UncomfortableTruth {
  truth: string;
  why_resisted: string;
  path_forward: string;
}

export interface Lever {
  lever: string;
  why_it_matters: string;
  how_to_start: string;
  timeline: string | null;
  requires_professional: boolean;
}

export interface SustainableImprovement {
  key_levers: Lever[];
  common_mistakes: string[];
}

export interface Specialist {
  type: string;
  role: string;
  notes: string | null;
}

export interface Community {
  name: string;
  platform: string;
  url: string | null;
  notes: string;
}

export interface FindingHelp {
  specialists: Specialist[];
  patient_communities: Community[];
}

export interface LearningResource {
  title: string;
  type: string;
  author_or_source: string | null;
  url: string | null;
  description: string;
  audience: "beginner" | "intermediate" | "advanced";
}

export interface SymptomPattern {
  id: string;
  label: string;
  description: string;
}

export interface SubConditionAffinity {
  sub_condition_id: string;
  patterns: string[];
}

export interface SymptomPatterns {
  patterns: SymptomPattern[];
  sub_condition_affinities: SubConditionAffinity[];
}

export interface ConditionSections {
  plain_summary: string;
  detailed_summary: string;
  sub_condition_signals?: Record<string, string>;
  prevalence: Prevalence;
  symptom_patterns?: SymptomPatterns;
  subgroups: Subgroup[];
  symptoms: Symptom[];
  testing: Testing;
  related_conditions: RelatedCondition[];
  symptom_management: SymptomManagement;
  uncomfortable_truths: UncomfortableTruth[];
  sustainable_improvement: SustainableImprovement;
  finding_help: FindingHelp;
  learning_resources: LearningResource[];
}

export interface ConditionData {
  condition_id: string;
  condition_name: string;
  generated_at: string;
  sections: ConditionSections;
}
