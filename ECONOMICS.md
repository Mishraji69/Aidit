# Unit Economics

## Working assumptions (update with real usage)
- Average audits per active account per month: 2 to 6
- Summary requests per audit: 1
- Average summary size: 400 to 800 tokens
- Storage per audit: ~5 to 20 KB

## Cost drivers
- OpenRouter summary requests (per-token cost)
- Supabase storage and bandwidth
- Vercel compute for API routes

## Example cost model (illustrative)
- Summary cost per audit: $0.01 to $0.05
- Storage per audit: <$0.001
- Total variable cost per audit: $0.02 to $0.06

## Pricing model hypothesis
- Free audit for first-time use.
- Paid tier for monitoring, multi-user access, and history.

## Margin targets
- Target gross margin: 70%+ at scale.
