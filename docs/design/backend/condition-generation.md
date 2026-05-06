# Conditioner

## Goal

Get all the data for conditions, make sure that we have a generated data file per condition with all the required data.

## Expected Behavior

1. Get all conditions
2. For each condition, run a prompt to get the required data. The prompt to be used is specified in `prompts/condition.yaml`.
3. put the file in the folder structure representing the condition tree `data/generated/<diagnosis>/<group>/<condition>/<subcondition>` e.g. `data/generated/ibs/enzyme/lactase`.

## Output Format

specified in [the prompt](prompts/condition.yaml)
additional fields:
- llm model use for generation

The generated `sections.relevance_signal` field is a one-sentence, patient-language pointer at the specific distinguishing pattern that makes the condition worth investigating (not generic symptoms). The entrypoint list surfaces it as a column so users can scan the list without opening every condition page.

## Constraints / Edge Cases

- For `related_conditions`, the prompt is given a catalog of every other condition in `data/conditions.yaml` (id, name, aliases). The catalog is framed explicitly as a *labeling reference, not a menu*: the model must generate the related-conditions list from medical knowledge first (comorbidity, mechanism, differential), independently of the catalog, and is expected to produce many entries with `id: null`. After generation, each entry's name is checked against the catalog and, if it matches, the corresponding id is populated. The frontend uses the id to render reliable cross-page links and shows entries with null ids as plain (non-linked) text — so unlinked conditions still surface in the UI rather than being filtered out. Name-based matching in the frontend is only a fallback for legacy data generated before this catalog was introduced.


## Implementation
- use claude for the prompts
- support test runs during development
    - generate a single condition: `cn generate --id <id>`
    - generate a subset: `--id` is repeatable (`--id ibs --id sibo --id mcas`)
    - choose the model: `--model <model-id>` (default: Haiku for low cost; pass Sonnet for higher quality)
    - `--force` to regenerate when a condition already has output
