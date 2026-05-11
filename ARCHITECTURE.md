# Architecture

## System summary
The AI Spend Audit Tool is a Next.js App Router application that combines a deterministic audit engine with optional AI summaries. Pricing and savings calculations are rule-based and never depend on model output.

## Runtime components
- Client UI: React components for inputs and results.
- API routes: Next.js route handlers for summary generation and saving.
- Data store: Supabase (audits table).
- AI: OpenRouter for summary generation only.

## Primary data flow
1. User enters tools and spend data in the form.
2. Client validates input with Zod.
3. Client runs the deterministic audit engine and renders results.
4. Client calls /api/summary for a short narrative summary.
5. Optional save calls /api/save to persist audit and return a share ID.
6. Share links render at /result/[id] and do not expose email.

## Deterministic audit engine
- Input: array of tools with usage type, plan, spend, team size, and use case.
- Output: totalSpend, totalSavings, yearlySavings, and recommendations.
- Primary recommendation is chosen per tool (highest savings).
- Alternatives are kept for display but excluded from totals.
- Safety guard caps total savings to total spend.

## API routes
- POST /api/summary
  - Validates payload and calls OpenRouter.
  - Returns summary text or a graceful null.
- POST /api/save
  - Validates payload and inserts into audits table.
  - Returns a shareId for /result/[id].
- GET /api/result/[id]
  - Fetches a saved audit by shareId and returns public data.

## Data model
Table: audits
- share_id (text, unique)
- tools (jsonb)
- audit (jsonb)
- email (text, nullable)
- created_at (timestamptz)

## Environment variables
- OPENROUTER_API_KEY
- OPENROUTER_MODEL (optional)
- OPENROUTER_REFERRER (optional)
- OPENROUTER_APP_NAME (optional)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

## Error handling
- Summary route logs OpenRouter errors and returns summary_unavailable.
- Save route logs database errors and returns db_insert_failed.
- UI shows neutral fallback messaging.

## Security and privacy
- Service role key stays server-side only.
- Public results never include email.
- Audit logic is deterministic and auditable.

## Deployment
- Vercel for web hosting.
- Supabase for data storage.
- Environment variables configured per environment.
