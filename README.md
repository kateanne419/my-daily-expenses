# Expense Tracker

Cross-platform expense tracker (iOS, Android, web) for daily expenses in PHP.

## Stack

- **Expo Router** — mobile + web UI
- **Supabase** — Postgres, auth, sync (optional; runs locally by default)
- **@expense-tracker/shared** — calculation engine and unit tests

## Quick start

```bash
cd ~/Projects/expense-tracker
npm install
npm run mobile:web    # or: npm run mobile
```

The app starts on the **current month** with empty balances, budgets, and transactions. Use the Dashboard arrows to switch months. Log expenses and transfers from the **Entry** tab.

## Supabase setup

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql`
2. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and add your URL + anon key
3. Restart Expo

## Tests

```bash
npm test
```

See `docs/spreadsheet-formulas.md` for calculation specs.
