# Condition Page

## Goal

Display all generated data for a single condition in a readable, navigable way — optimised for who may only want specific sections.

## Expected Behavior

- Each condition has its own page, navigated to from [search](search.md) or a [starting point](starting-points.md)'s sub-condition table
- The page header shows: condition name, aliases and the group label
- Sections and subsections are shown as **accordions** — collapsed by default, user expands what they need
- A "back to list" link is always visible at the top

### sections (in order)

- Detailed Summary | `detailed_summary` |
- How common is it? | `prevalence` |
- Known subtypes | `subgroups` |
- Symptoms | `symptoms` — grouped by `category` |
- How to test for it? | `testing`
     - patterns | `patterns`
     - at-home | `at_home`
     - clinical | `clinical`
- Related conditions | `related_conditions` |
- How to manage symptoms | `symptom_management` (strategies + things to avoid) |
- Uncomfortable truths | `uncomfortable_truths` |
- How to truly improve | `sustainable_improvement` (levers + common mistakes) |
- Find help | `finding_help` (specialists + communities) |
- Learn more | `learning_resources` |

#### Ideas for new sections
don't implement yet.
- New scientific findings
     - helps people to get an update of the newest findings of the last 3-5 years. Links to science

## Output Format

Route: `/condition/:id`. See [general.md](general.md) for the shared tech stack and visual design decisions.

## Data Source

Each condition's data file at `data/generated/<group_id>/<condition_id>.json` (subtypes at `data/generated/<group_id>/<parent_id>/<condition_id>.json`).

The SPA resolves the file path from the condition index (which includes `group_id` and `parents`).

## Constraints / Edge Cases

- If the condition data file does not exist (condition is in index but `has_data: false`), show the condition name and a message that data has not been generated yet
- Related conditions that exist in the index should be rendered as clickable links to their own page
- `learning_resources` URLs should open in a new tab
- The page title (`<title>`) should include the condition name

## Implementation

- Add a `/condition/:id` route to the shared SPA
- Load condition data lazily when the page is navigated to
- Sections with empty data (empty list or null) are hidden, not shown as empty accordions
- The `plain_summary` is always visible in the page header (not in an accordion)


