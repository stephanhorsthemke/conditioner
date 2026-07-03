# Probability

## Scope

Probability is **per [starting point](starting-points.md)**. Each starting point ranks
its own candidate sub-conditions by how likely they are within that context — e.g. the
IBS starting point ranks conditions by relative likelihood among IBS patients. There is
no global or per-page probability; only starting-point tables are ranked.

## Goal

Help the user scan the most likely conditions first by sorting a starting point's
sub-condition table by static prevalence within that context, with a quick visual
indicator on each row.

## Expected Behavior

- A starting point's sub-condition table is sorted by probability descending (most
  likely first).
- Each row shows a 1–5 dot indicator (`●●●○○`).
- Conditions missing a probability value default to 1 (one filled dot, sorted to the bottom).

## Visual Probability Indicator

Each row shows 5 dots derived from its probability value:

`level = clamp(round(probability), 1, 5)`

e.g. `●●●○○` = level 3. Static — no interactivity.

## Data Source

Probability lives inline in `data/starting_points.yaml`: each entry's `sub_conditions`
list carries a `probability` integer (1–5) per condition, representing relative
prevalence within that starting point's context (e.g. IBS patients for the IBS starting
point). Owner-edited. It flows into `data/generated/starting_points/index.json` and is
read by the sub-condition table.

## Constraints / Edge Cases

- Sub-conditions missing a `probability` default to 1 (sink to the bottom).
- Subtypes (e.g. sibo_h2, sibo_ch4, sibo_h2s) are scored individually rather than
  inheriting their parent's value.
- The dot indicator is purely visual — it is a static prevalence hint, not a
  personalised risk estimate (see [legal.md](legal.md)).

## Implementation

- `data/starting_points.yaml` — `sub_conditions[].probability` (owner-edited).
- `web/src/types.ts` — `SubConditionRef.probability`.
- `web/src/components/SubConditionTable.tsx` — sorts rows descending and renders the
  dot indicator.
