# Probability

## Scope

Probability is **per-space**. A [space](spaces.md) optionally references its own probability JSON file via the `probability` field in `data/spaces.yaml`. Spaces without that field show no probability column.

The current probability data is scoped to the **IBS space** — its rankings reflect the relative likelihood of an IBS patient having each condition. The main space does not currently define probability, so its list is unsorted by relevance.

## Goal

Help the user scan the most likely conditions first by sorting the list by static prevalence among IBS patients, with a quick visual indicator on each row.

## Expected Behavior

- The condition list is sorted by probability descending (most likely first)
- Each condition row in the active space shows a 1–5 dot indicator (`●●●○○`)
- The "Probability" column header appears only when the active space defines probability data
- Conditions missing from the data default to probability 1 (one filled dot, sorted to the bottom)

## Visual Probability Indicator

Each condition row shows 5 dots derived from its base probability value:

`level = clamp(round(base[id]), 1, 5)`

e.g. `●●●○○` = level 3. Static — no interactivity.

## Data Source

The active space's `probability` field points at a static JSON file (e.g. `data/probability.json` for the IBS space). The file is served by Vite (publicDir: `../data`). Shape:

```json
{
  "base": { "condition_id": 1 }
}
```

Values are integers 1–5 representing relative prevalence among that space's target population (IBS patients, for the IBS space). Owner-edited.

## Constraints / Edge Cases

- If the active space does not define a `probability` reference, or the referenced file fails to load, the column is silently hidden and the list keeps its natural order
- Conditions in the active space that are missing from `base` default to probability 1 (sink to the bottom)
- Subtypes (sibo_h2, sibo_ch4, sibo_h2s) are scored individually rather than inheriting their parent's value

## Implementation

- `data/probability.json` — static data file (just `base`)
- `web/src/types.ts` — `ProbabilityData` type
- `web/src/pages/ConditionList.tsx` — fetches the space's probability file, sorts rows descending, renders the dot indicator
