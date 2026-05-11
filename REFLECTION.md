# Reflection

## What went well
- Clear separation between deterministic audit logic and AI summaries.
- Form UX is fast and resilient with local persistence.
- Shareable results flow is simple and transparent.

## Challenges
- Preventing double-counted savings across multiple recommendations.
- Balancing UI polish with minimal color usage.
- Handling provider-specific constraints for OpenRouter models.

## Decisions
- Keep audit calculations deterministic and client-side.
- Use OpenRouter for summaries only, with graceful fallback.
- Store full audit payload in Supabase for public sharing.

## Next steps
- Add API integration tests and error surfacing for save/summary.
- Expand pricing coverage and allow custom tool entries.
- Add usage-based benchmarking insights.
