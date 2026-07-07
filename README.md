# Expense Tracker

Cross-platform expense tracker (iOS, Android, web) mirroring your Daily Expenses Google Sheet.

## Stack

- **Expo Router** — mobile + web UI
- **Supabase** — Postgres, auth, sync (optional; runs locally with demo data)
- **@expense-tracker/shared** — calculation engine with June 2026 test fixtures

## Quick start

```bash
cd ~/Projects/expense-tracker
npm install
npm run mobile:web    # or: npm run mobile
```

Open the **Entry** tab to log expenses/transfers. **Dashboard** shows on-hand, budgets, insights, predictions, and tips.

## Supabase setup

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql`
2. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and add your URL + anon key
3. Restart Expo

## Tests

```bash
npm test
```

## Google Sheets import

```bash
GOOGLE_ACCESS_TOKEN=... npx tsx scripts/import-google-sheet.ts
```

See `docs/spreadsheet-formulas.md` for calculation specs.
