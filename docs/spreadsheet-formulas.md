# Spreadsheet Formulas — Daily Expenses

Source workbook: [Daily Expenses](https://docs.google.com/spreadsheets/d/1Pu2DIwmiIw_6wHdsHAjz6TDPJOct3MGhscicELvQ1Vo/edit)

Currency: **PHP (₱)**

## Confirmed formulas (June 2026)

### On-hand (spendable)

```
onHand = SUM(all account balances)
```

Includes negative credit card balances and Splitwise receivable. **June 2026:** ₱21,611.01

### Total income

```
totalIncome = SUM(income source amounts)
```

**June 2026:** ₱38,326.50

### Total expenses (header)

```
totalExpenses = fixedSpent + variableSpent − savingsSpent
```

Savings (`Monthly Savings` fixed budget) is tracked in the header but excluded from "Expenses".

**June 2026:** ₱52,060.09 (= 68,560.09 − 16,500)

### Budget roll-ups

| Metric | Formula |
|--------|---------|
| Fixed budget total | SUM(fixed.budget) where not savings |
| Fixed spent total | SUM(fixed.spent) where not savings |
| Variable budget total | SUM(variable.budget) |
| Variable spent total | SUM(variable.spent) |
| Combined budget | fixed + variable |
| Combined spent | fixed spent + variable spent |

### Daily spending MTD

```
dailyMTD = SUM(daily amounts for days through today)
```

**Note:** Row 1 (6/1) often shows an opening/on-hand snapshot (₱20,711) rather than daily spend. The app treats rows marked `is_opening_snapshot` separately from burn-rate calculations.

Sheet total row B61 through 6/15 includes all daily column values.

### Fixed budget paid status

Each item: Budget, Spent, Paid (✔/✗), optional Due date.

## Pending confirmation (export .xlsx for raw formulas)

- Exact filter for "Daily Spending (exc. bills)" transaction inclusion
- Whether account balances are manual vs derived from prior month + txns + transfers
- Category → fixed vs variable mapping for edge cases

## App implementation

See `packages/shared/src/calculations/` — unit tests locked to `fixtures/june2026.ts`.
