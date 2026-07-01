# External Service Costs

## Anthropic (Claude API)

- **Default model**: claude-haiku-4-5-20251001 (generation and tests)
- **Override**: any condition can be generated against a different model via `cn generate --model <id>`. Sonnet (claude-sonnet-4-6) is used for higher-quality runs of priority conditions.
- **Pricing**: $3 / 1M input tokens, $15 / 1M output tokens (Sonnet, as of 2026-04); $0.80 / 1M input tokens, $4 / 1M output tokens (Haiku, as of 2026-04)
- **Batch API discount**: `cn generate --batch` submits all selected conditions in one Anthropic Batch API call. 50% off input+output tokens; up to 24h SLA (usually minutes for batches of this size). Use for large regenerations (10+ conditions) when latency doesn't matter.
- **Usage pattern**: One or more prompts per condition, run on-demand (not continuously)
- **Estimate**: ~1,000 input + ~500 output tokens per prompt per condition; costs are negligible for prototyping

Update this file when:
- A new model is used
- A new prompt section is added
- Generation is scheduled/automated
