# Search

## Goal

One global search that lets the user quickly find **any page** in the navigator —
conditions, [starting points](starting-points.md), and (where they exist)
[mechanisms](../mechanisms.md).

## Expected Behavior

- A search box in the shared page header, so search is reachable from anywhere.
- Typing filters results in real time by **name or alias**, case-insensitive
  (e.g. "HIT" finds Histamine intolerance).
- Pressing Enter, or clicking the header search box, navigates to the global search
  page at `/search`. The current query is reflected in the URL (`/search?q=hist`) so
  results are linkable and survive refresh/back.
- The search page lists matching results grouped or labelled by kind
  (Condition · Starting point · Mechanism) so the user can tell what they are opening.
- Each result shows its display name and a short type/context hint. Clicking a result
  navigates to that page (`/condition/:id`, `/start/:id`, `/mechanism/:id`).
- With an **empty query**, the page shows the full catalogue — this is the
  "Browse all conditions / everything" path linked from the home page.

## Output Format

Route: `/search` (optionally `?q=...`). See [general.md](general.md) for the shared
tech stack and visual design decisions.

## Data Source

The global condition index at `data/generated/index.json` and the starting-points index
at `data/generated/starting_points/index.json` (both produced by the CLI). Mechanisms,
once they exist, contribute their own index. The search page fetches these at startup
and merges them into one searchable list of pages. No backend server required.

## Constraints / Edge Cases

- Search matches aliases as well as names.
- Conditions with `has_data: false` may still appear (so the graph is discoverable);
  opening one shows the "not generated yet" state on the condition page.
- If an index file fails to load, search degrades to whatever indexes did load rather
  than showing a broken page.
- No query and no results (e.g. index missing entirely) shows a friendly empty state nudging the user to let us know if they think something is missing.
- No user data, no query logging, no cookies (see [general.md](general.md)).
- `<title>` on `/search` reflects the query when present, else "Search · Condition Navigator".

## Implementation

- `web/src/pages/SearchPage.tsx` — the global search page; reads `?q=` from the URL.
- `web/src/components/SearchBox.tsx` — reusable input used on the home page and in the
  header; on Enter it navigates to `/search?q=...`.
- `web/src/App.tsx` — add the `/search` route.
- Fetch and merge `index.json` + `starting_points/index.json` into a single list of
  `{ id, name, aliases, kind, route }` entries and filter client-side.
