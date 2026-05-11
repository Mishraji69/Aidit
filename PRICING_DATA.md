# Pricing Data

## Source of truth
Pricing data lives in lib/pricing.ts and drives form defaults and audit logic.

## Data model
Each tool entry includes:
- toolName
- category
- usageTypes
- plans (label, priceMonthly, perSeat)
- api (pricePerMillionTokens) when relevant

## Plan keys and conventions
- Use lowercase keys (e.g., plus, team, enterprise).
- Keep plan IDs stable to avoid breaking saved audits.
- Per-seat plans multiply by team size; flat plans use the plan price as-is.

## Update checklist
1. Verify pricing on official vendor pages.
2. Update plan prices in lib/pricing.ts.
3. Add new tools only after defining plan IDs and usageTypes.
4. Run tests to ensure validation still passes.

## Notes
- Pricing is a seed dataset and may not match live vendor pricing.
- Monthly spend remains editable in the UI for real-world adjustments.
