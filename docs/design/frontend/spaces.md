# Spaces

## Goal

Let a single condition navigator host multiple thematic views ("spaces") over the same condition graph — e.g. an IBS space focused on IBS drivers and mimics, a main space showing every condition, and (future) other spaces like an asthma space or an EDS/POTS space — without duplicating condition data.

## Core idea

A **space** is a named, filtered view over the global condition list. Conditions themselves do not know which spaces they belong to. Membership is decided by per-space rules in a single config file.

This keeps the condition graph (`data/conditions.yaml`) focused on _what conditions exist and how they relate_, and keeps display/scoping concerns (`data/spaces.yaml`) separate.

## Expected Behavior

- The app has one or more spaces. Two are mandatory:
  - `main` — shows every condition.
  - `ibs` — shows the subset relevant to IBS.
- Each space has its own URL, label, and (optionally) its own probability data.
- Switching spaces is a top-level navigation action. The user can always reach the main space from any other space.
- The current space scopes the entrypoint list and the probability column. The condition page itself is not space-scoped — a condition has one canonical page regardless of which space the user came from.

## Routes

- `/` → main space (entrypoint list of all conditions)
- `/space/:id` → other spaces (e.g. `/space/ibs`)
- `/condition/:id` → condition page (unchanged; not space-scoped)

A small space switcher in the page header lets the user jump between spaces.

## Data Source

`data/spaces.yaml` — owner-edited. Shape:

```yaml
spaces:
  - id: main
    label: All conditions
    description: Every condition in the navigator.
    include: all

  - id: ibs
    label: IBS-related conditions
    description: Drivers, mimics, and overlaps relevant to IBS.
    include: all
    exclude: [adhd, allergy]
    probability: data/probability.json
```

### Membership rules

`include` is one of:

- `all` — every condition in the global index.
- A list of condition IDs — only those.
- An object `{ groups: [group_id, ...] }` — every condition whose `group_id` is in the list.

`exclude` is an optional list of condition IDs that are removed after `include` is resolved. Always wins over `include`.

`probability` is an optional path to a probability JSON file scoped to that space (see [probability.md](probability.md)). If absent, the space shows the entrypoint list without a probability column and in unsorted order.

A condition can belong to zero, one, or many spaces. Membership is computed at load time by the frontend.

## Constraints / Edge Cases

- If `data/spaces.yaml` is missing, the frontend falls back to a single implicit `main` space containing every condition.
- If a space references a condition ID that does not exist in `index.json`, the reference is silently ignored (not an error — keeps spaces resilient to condition renames).
- An empty space (after include/exclude resolution) shows a friendly empty state rather than an error.
- Subtypes follow their parent — if a parent is excluded, its subtypes are also excluded from that space, unless explicitly re-included.
- The `main` space is reserved and always means "everything"; its `include`/`exclude` is ignored if both are set, and a warning is logged.

## Implementation

- `data/spaces.yaml` — owner-edited config.
- `web/src/types.ts` — add `Space`, `SpaceMembership` types.
- `web/src/spaces.ts` — load `spaces.yaml` (parsed at build time or fetched as JSON) and resolve membership for the current space.
- `web/src/App.tsx` — add `/space/:id` route alongside `/`.
- `web/src/pages/ConditionList.tsx` — accept a `spaceId` prop and filter the index accordingly; load space-specific probability data when present.
- `web/src/components/SpaceSwitcher.tsx` — header dropdown listing available spaces.

## Why this design

- **Single source of truth for membership.** Adding or removing a condition from a space is a one-line edit in one file.
- **Conditions stay self-describing.** No `spaces:` field on individual conditions — the graph is unchanged when spaces evolve.
- **Cheap to add new spaces.** A new themed view (e.g. asthma, EDS/POTS, histamine complex) is a new entry in `spaces.yaml`, not new tags across 40+ conditions.
- **Flexible inclusion modes.** `all`, by-id, and by-group cover the common patterns without bespoke logic per space.
