# Frontend — General Design

## Goal

Build a frontend that is genuinely comfortable to use for people managing a chronic health condition — including those experiencing brain fog, fatigue, or light sensitivity. The UI should feel calm and uncluttered rather than clinical or overwhelming.

## Visual Design

### Dark mode by default

- The default theme is dark. Dark mode reduces eye strain for users with light sensitivity, which is common across many of the conditions in this graph.
- A light/system-preference toggle is available but not prominently pushed — dark is the right default for this audience.
- Avoid pure black (`#000`) backgrounds; use a soft dark grey (e.g. `#1a1a1a` or similar) to reduce the harsh contrast of white text on absolute black.

### Color palette

- Low-saturation, muted accent colors — avoid bright, high-chroma hues.
- Reserve color for meaningful signals only (e.g. "data not yet available" state). Do not use color decoratively.
- Sufficient contrast for text (WCAG AA as a minimum), but not so high that white text on dark feels harsh.

### Typography

- Use a legible, humanist sans-serif. System font stack is acceptable; a font like Inter or similar is fine.
- Body font size: no smaller than 16px.
- Generous line-height (1.6–1.8) for body text to aid reading with brain fog.
- Limit line length to ~70 characters for comfortable reading.

### Layout and spacing

- Generous white (or dark) space — do not pack content tightly.
- One clear visual hierarchy: page header → primary content → secondary details.
- Avoid sidebars, floating panels, or overlapping layers that require spatial reasoning.

## UX Principles

- **Progressive disclosure**: show a minimal summary first; let the user pull more detail by expanding accordions. This is especially important for people who can only process small amounts of information at once.
- **No surprises**: navigation should be predictable. Back always goes back. Links that open a new tab are marked with an external-link indicator.
- **Minimal interactivity overhead**: the UI should not require hover states to reveal content. Touch-friendly tap targets (min 44×44 px).
- **Fast load**: no spinners on the critical path. The condition list and index load in a single static fetch.

## Tech Stack

- **Framework**: React + Vite SPA
- **Routing**: React Router (client-side), routes defined in one place
- **Output**: `web/dist/` — static files, no backend server required
- **Data**: static JSON files fetched from `data/generated/`. No API server.
- **Styling**: CSS Modules or a lightweight utility approach — no heavy UI framework. Keep the dependency footprint small.

## Constraints

- No authentication, no user data, no cookies.
- Must work without JavaScript disabled? No — a React SPA is acceptable.
- Must degrade gracefully if a data file is missing (show a friendly message, not a broken page).
- External links (`learning_resources`, etc.) open in a new tab with `rel="noopener noreferrer"`.
- `<title>` of every page should reflect the current content (condition name, or "Condition Navigator" for the list).
