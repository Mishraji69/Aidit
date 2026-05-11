# AI Spend Audit Tool

Production-ready MVP for auditing AI tooling spend with deterministic savings logic.

## Overview

- Rule-based audit engine for AI tool usage
- Optional AI-generated summary (Anthropic)
- Save audits to Supabase and generate shareable result pages

## Local development

1. Install dependencies: npm install
2. Start dev server: npm run dev
3. Run tests: npm test
4. Build for production: npm run build

## Environment variables

- ANTHROPIC_API_KEY (required for AI summaries)
- ANTHROPIC_MODEL (optional override)
- SUPABASE_URL (required for save/share)
- SUPABASE_SERVICE_ROLE_KEY (required for save/share)

## Supabase schema

Create a table named audits with the following columns:

- share_id (text, unique)
- tools (jsonb)
- audit (jsonb)
- email (text, nullable)
- created_at (timestamp, default now)
