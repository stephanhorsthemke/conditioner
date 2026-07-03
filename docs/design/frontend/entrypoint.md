# Entrypoint — Home Page

## Goal

Give the user one calm, uncluttered front door at `/` that orients them and offers
two ways in: **start from a symptom or diagnosis** (a curated [starting point](starting-points.md))
or **search** for any page directly ([search.md](search.md)). The home page itself
carries no long condition list — browsing everything happens through search.

## Expected Behavior

- The route `/` renders the home page
- A short, plain-language welcome that speaks to someone who has decided to take
  their health into their own hands — validating and hopeful, never clinical. It
  makes the two ways in obvious (start from a symptom/diagnosis, or search) and
  sets the tone: this is a tool for self-advocates that helps them get to the right
  help faster, not a diagnosis. Implemented copy:
  - Headline: **Navigat.**
  - Body: *For anyone living with chronic symptoms who has decided to help
    themselves. Get an overview of the conditions that might be behind how you feel,
    learn what actually matters, and walk into your next appointment knowing what to
    ask. *
- A **search box** is prominent near the top. Typing filters/opens global search;
  pressing Enter navigates to the global search page (see [search.md](search.md)).
- A **"Start from a symptom"** section shows the available starting points (currently
  IBS and brain fog) as tappable cards. Each card shows the starting point's label and
  a one-line description. Clicking a card navigates to `/start/:id`.
- A quiet **"Browse all conditions"** link routes to the global search page with an
  empty query (which lists everything). There is no separate "all conditions" route.
- A gentle **seek-professional-help** line is part of the page content, not buried
  fine print — e.g. "This is informational, not a diagnosis. See a doctor for anything that feels serious." (see [legal.md](legal.md)).

## Output Format

Routes:

- `/` — the home page (this doc).
- `/start/:id` — a starting point (see [starting-points.md](starting-points.md)).
- `/condition/:id` — a condition page (see [condition-webpage.md](condition-webpage.md)).

See [general.md](general.md) for the shared tech stack and visual design decisions.

## Data Source

One static file: the starting-points index at
`data/generated/starting_points/index.json` (produced by the CLI). The home page reads
`id`, `label`, and `intro`/description from each entry to render the cards. Search
loads its own index — see [search.md](search.md).

The SPA fetches this at startup. No backend server required.

## Constraints / Edge Cases

- If the starting-points index is missing or empty, hide the "Start from a symptom"
  section and keep the search box as the primary path — the page still works.
- The seek-help line and search box are always present, even in empty states.
- Cards are ordered by the order they appear in the index (owner-controlled).
- `<title>` on `/` is "Condition Navigator".

## Implementation

- `web/src/pages/HomePage.tsx` — the home page component.
- `web/src/App.tsx` — `/` routes to `HomePage`.
- Fetch `data/generated/starting_points/index.json` (served via Vite's publicDir) at
  startup and render one card per entry.
- The search box and "Browse all conditions" link both route into the global search
  page (`/search`).
