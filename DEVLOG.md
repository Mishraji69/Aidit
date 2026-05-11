# Dev Log

## 2026-05-12
- Summary: Resolved audit savings double-counting and updated results UI hierarchy.
- Changes:
	- Primary vs alternative recommendation logic.
	- Savings guard: totalSavings <= totalSpend.
	- Results UI grouped by tool.
- Tests: npm test, npm run build.
- Notes: OpenRouter model availability varies by account.

## 2026-05-11
- Summary: Added save/share flow and OpenRouter summary integration.
- Changes:
	- Supabase save and public result endpoints.
	- OpenRouter summary pipeline.
	- Analytics-style UI refresh.
- Tests: npm test.

## 2026-05-10
- Summary: Base audit engine and dynamic tool form completed.
- Changes:
	- Deterministic audit rules.
	- Pricing data wiring and local persistence.
- Tests: npm test.
