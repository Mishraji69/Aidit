# Tests

## How to run
- npm test
- npm run build

## Coverage today
- Audit engine rules
	- Plan downgrades and alternatives
	- API overspend logic
	- Primary vs alternative recommendation selection
	- Savings cap (totalSavings <= totalSpend)
- Validation
	- Tool/plan combinations
	- Share ID format

## Test files
- tests/audit.test.ts
- tests/validation.test.ts

## Add new tests
1. Create a new file under tests/.
2. Import the module under test.
3. Focus on pure functions and deterministic outcomes.

## Gaps to fill
- API route integration tests (summary and save)
- UI component tests for Results grouping
- Supabase save flow tests with a test database
