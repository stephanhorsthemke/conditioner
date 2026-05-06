# Nodes
Nodes will be entities which have pages. It needs to be some kind of concept which is interesting to the patient.

## Ideas
1. Conditions, they have a diagnosis
2. Mechanisms, they are important reasons for one ore more conditions, like Leaky Gut







# Mechanisms - Claude generated

## Goal

Introduce a second entity type — **mechanisms** — alongside conditions. Mechanisms are physiological processes or states that sit between conditions in the graph: they are caused by one or more conditions and in turn enable or worsen others. Unlike conditions, mechanisms are not directly diagnosable; they explain *why* multiple conditions cluster together in the same person.

Examples: leaky gut (intestinal hyperpermeability), Th2 immune skewing, HPA axis dysregulation, SCFA deficiency, vagal tone impairment, histamine load, visceral hypersensitivity.

## Expected Behavior

### Data layer

- Mechanisms are defined in `data/mechanisms.yaml`, separate from `data/conditions.yaml`
- Each mechanism has:
  - `id`: unique slug (e.g. `leaky_gut`, `hpa_dysregulation`)
  - `name`: display name
  - `aliases`: optional list of alternative names
  - `upstream`: list of condition or mechanism IDs that commonly cause or trigger this mechanism
  - `downstream`: list of condition or mechanism IDs that this mechanism commonly enables or worsens
- Generated data is stored at `data/generated/mechanisms/<mechanism_id>.json`, produced by `cn generate --mechanisms`
- The condition index (`data/generated/index.json`) is extended to include mechanisms, flagged with `"type": "mechanism"`

### Mechanism page

- Route: `/mechanism/:id`
- The page header shows: mechanism name, aliases (if any), and the plain summary
- All other sections are shown as **accordions** — collapsed by default, same pattern as condition pages

#### Accordion sections (in order)

| Accordion label | Content |
|---|---|
| What is it? | `detailed_summary` |
| Why does it matter? | `significance` — what it enables downstream, why it appears across multiple conditions |
| What causes it? | `upstream_conditions` — linked list of conditions/mechanisms that drive it |
| What does it lead to? | `downstream_conditions` — linked list of conditions/mechanisms it contributes to |
| How to know if it applies to you | `self_assessment` — signs this mechanism is active; measurable markers if any |
| How to address it | `addressing` — always indirect: treat the upstream causes; pointers back to relevant condition pages |

- Upstream and downstream entries that exist in the index are rendered as clickable links to their condition or mechanism page
- Sections with no data are hidden

### Condition pages — mechanism integration

- Each condition page gains a new accordion section: **"Why this happens"**
- This section lists the mechanisms the condition feeds into and/or is downstream of, with links to mechanism pages
- This section appears between "Related conditions" and "How to manage symptoms" in the accordion order
- If a condition has no linked mechanisms, the section is hidden

### Entrypoint — condition list

- Mechanisms are listed in a separate section below the condition list, headed "Mechanisms"
- The same real-time search filters both sections simultaneously
- Mechanism rows are visually distinct from condition rows (e.g. a subtle label or different left-border treatment) — they should not look like conditions
- Mechanisms do not participate in the probability ranking (they have no entry in `base`)

## Output Format (generated JSON)

```json
{
  "id": "leaky_gut",
  "name": "Leaky gut",
  "aliases": ["intestinal hyperpermeability"],
  "plain_summary": "string",
  "detailed_summary": "string",
  "significance": "string",
  "upstream_conditions": ["dysbiosis", "mcas", "hpa_dysregulation"],
  "downstream_conditions": ["mcas", "histamine", "atopic_dermatitis"],
  "self_assessment": {
    "patterns": ["string"],
    "markers": ["string"]
  },
  "addressing": ["string"],
  "generated_by_model": "string"
}
```

`upstream_conditions` and `downstream_conditions` contain IDs that may refer to either conditions or mechanisms. The frontend resolves them via the index.

## Constraints / Edge Cases

- Mechanisms must not be confused with conditions: the page design, URL namespace (`/mechanism/` vs `/condition/`), and list labels must keep them clearly distinct
- A mechanism may appear in both `upstream` and `downstream` of another mechanism (loops are possible — e.g. leaky gut and dysbiosis reinforce each other); the frontend must not attempt to render these as a tree
- If a mechanism's data file does not exist, show the name and a "data not yet generated" message, same as conditions
- Mechanism IDs must not collide with condition IDs — the index is shared
- `cn generate` without flags generates conditions only; `cn generate --mechanisms` generates mechanisms only; `cn generate --all` generates both
