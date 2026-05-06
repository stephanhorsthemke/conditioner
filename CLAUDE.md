# Condition Navigator

## Project Overview

A prototype service that:
1. Maintains a graph of health conditions (e.g. IBS → SIBO, SNAS)
2. Generates structured data per condition via Claude prompts
3. Visualizes conditions as an explorable web interface

## Architecture


- make separate components for each of the design documents (except the general ones) with clear APIs
- **data/conditions.yaml**: The condition graph — source of truth for which conditions exist and how they relate
- **data/generated/**: One JSON file per condition, produced by the generator
- **src/condition_navigator/models.py**: Pydantic models for conditions and generated output
- **src/condition_navigator/generator/**: Claude-based generation logic
- **src/condition_navigator/cli.py**: CLI entry point (`cn generate`, `cn list`, etc.)
- **web/**: Frontend visualization (TBD — defer until a design doc exists)
- **tests/**: Mirrors `src/` structure with `test_` prefixed files
- **docs/design/**: High-level design documents describing desired behavior

## Design Documents

The `docs/design/` directory contains high-level specifications written by the project owner. These documents describe **what** the system should do, not how. When implementing features:

1. **Always read the relevant design doc first** before writing code
2. Design docs are the source of truth for intended behavior
3. If a design doc is ambiguous, ask for clarification rather than guessing
4. After implementing a design doc, do NOT modify the doc — it stays as the spec

### Design doc format

Each design doc follows this template:
```
# Feature Name
## Goal
## Expected Behavior
## Output Format (if applicable)
## Constraints / Edge Cases
```

## Condition Graph

Conditions are defined in `data/conditions.yaml`. Each condition has:
- `id`: unique slug (e.g. `ibs`, `sibo`)
- `name`: display name
- `aliases`: optional list of alternative names
- `parents`: list of parent condition IDs (empty list = root condition)
- `tags`: optional metadata tags

The graph is a DAG — a condition can have multiple parents, and depth is arbitrary.


## Generation

[The conditioner](docs/design/conditioner.md) generates the condition data.


## Code Conventions

- Python 3.11+
- Use `anthropic` SDK for Claude API calls
- Use `pydantic` for data models and validation
- Use `click` for CLI
- Use `PyYAML` for reading conditions.yaml
- Type hints on all public functions
- Add `print()` statements to show progress during generation
- One responsibility per module — keep generator, models, and CLI separate

## Environment Setup

```bash
python3 -m venv .venv
source .venv/bin/activate  # or .venv/bin/activate.fish
pip install -e ".[dev]"
```

API keys go in `.env` (see `.env.example`).

## Testing

- Run tests: `.venv/bin/pytest`
- Run single test: `.venv/bin/pytest tests/path/to/test_file.py::test_name`
- Tests use `pytest-asyncio` for async tests
- Mock Claude API calls — never hit real endpoints in tests
- Use `claude-haiku-4-5-20251001` as the model in any test fixtures or mocked calls that reference a model name — keep costs low
- **When fixing a bug, add a test that would have caught it**

## Common Tasks

- **Add a condition**: Edit `data/conditions.yaml`
- **Add a prompt/section**: Add to `src/condition_navigator/generator/prompts.py` and update the output model in `models.py`
- **Generate data**: `cn generate` (all conditions) or `cn generate --id ibs` (one condition)
- **Add a pipeline step**: Implement and register in `src/condition_navigator/generator/pipeline.py`
- **Frontend**: Deferred — see `web/` and wait for a design doc

## Dependencies

Managed via `pyproject.toml`. Install with `pip install -e ".[dev]"` inside `.venv`.

## Costs

External API costs are documented in [`docs/costs.md`](docs/costs.md).
**Update that file whenever a new model or prompt is added, or usage patterns change.**

## Legal considerations
- *Language discipline* — Train yourself and your team to use informational framing religiously. "People with these symptoms often have IBS" is very different from "you have IBS." This is a product design decision as much as a legal one, and it should be baked into every piece of copy, every AI prompt, every UI element.
- A strong *seek professional help* signal — Every time your product touches something that could be serious, it should clearly and naturally direct users toward a doctor. Not as a defensive disclaimer buried in fine print, but as a genuine part of the product experience. This is also just good product design — you're not trying to replace the doctor, you're helping people get to the right help faster.
- Don't collect any user data!
- be genuinely helpful, be honest about uncertainty, don't pretend to be a doctor, protect user data, and always point people toward real medical care when it matters. 