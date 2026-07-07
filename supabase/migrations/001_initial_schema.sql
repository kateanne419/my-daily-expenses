-- Expense Tracker initial schema
-- All tables scoped by user_id with RLS

create extension if not exists "pgcrypto";

-- Accounts (banks, wallets, cash, credit cards, Splitwise)
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'ewallet', 'cash', 'credit_card', 'splitwise', 'other')),
  current_balance numeric(12,2) not null default 0,
  credit_limit numeric(12,2),
  statement_day smallint,
  due_day smallint,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Month snapshots for fast dashboard
create table public.month_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  month int not null check (month between 1 and 12),
  label text not null,
  total_income numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  total_savings numeric(12,2) not null default 0,
  on_hand numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.month_snapshots(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null,
  linked_account_id uuid references public.accounts(id),
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.month_snapshots(id) on delete cascade,
  date date not null,
  category text not null check (category in ('Bills', 'Food', 'Transpo', 'Personal Care', 'Hobbies', 'Shopping', 'Grocery')),
  amount numeric(12,2) not null check (amount > 0),
  account_id uuid not null references public.accounts(id),
  description text,
  created_at timestamptz not null default now()
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.month_snapshots(id) on delete cascade,
  date date not null,
  from_account_id uuid not null references public.accounts(id),
  to_account_id uuid not null references public.accounts(id),
  amount numeric(12,2) not null check (amount > 0),
  notes text,
  created_at timestamptz not null default now(),
  check (from_account_id <> to_account_id)
);

create table public.fixed_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.month_snapshots(id) on delete cascade,
  name text not null,
  budget_amount numeric(12,2) not null default 0,
  spent_amount numeric(12,2) not null default 0,
  is_paid boolean not null default false,
  due_date date,
  is_savings boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.variable_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.month_snapshots(id) on delete cascade,
  category text not null check (category in ('Bills', 'Food', 'Transpo', 'Personal Care', 'Hobbies', 'Shopping', 'Grocery')),
  budget_amount numeric(12,2) not null default 0,
  spent_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (month_id, category)
);

create table public.personal_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  counterparty_name text not null,
  direction text not null check (direction in ('they_owe_me', 'i_owe_them')),
  amount numeric(12,2) not null,
  remaining numeric(12,2) not null,
  notes text,
  due_date date,
  status text not null default 'open' check (status in ('open', 'settled')),
  created_at timestamptz not null default now()
);

create table public.credit_card_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month_id uuid not null references public.month_snapshots(id) on delete cascade,
  date date not null,
  to_card_account_id uuid not null references public.accounts(id),
  from_account_id uuid not null references public.accounts(id),
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- RLS
alter table public.accounts enable row level security;
alter table public.month_snapshots enable row level security;
alter table public.income_sources enable row level security;
alter table public.transactions enable row level security;
alter table public.transfers enable row level security;
alter table public.fixed_budgets enable row level security;
alter table public.variable_budgets enable row level security;
alter table public.personal_debts enable row level security;
alter table public.credit_card_payments enable row level security;

create policy "accounts_own" on public.accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "months_own" on public.month_snapshots for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "income_own" on public.income_sources for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tx_own" on public.transactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "xfer_own" on public.transfers for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "fixed_own" on public.fixed_budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "var_own" on public.variable_budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "debts_own" on public.personal_debts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ccpay_own" on public.credit_card_payments for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index idx_accounts_user on public.accounts(user_id);
create index idx_transactions_month on public.transactions(month_id, date desc);
create index idx_transfers_month on public.transfers(month_id, date desc);
