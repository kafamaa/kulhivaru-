-- GameOn MVP finance schema
-- Provides enough structure to power a tournament-scoped finance page:
-- accounts, team-fee receivables, payments, and a minimal ledger for traceability.

-- -----------------------------------------------------------------------------
-- 1) Tournament finance settings (drives expected revenue)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tournament_finance_settings (
  tournament_id uuid PRIMARY KEY REFERENCES public.tournaments(id) ON DELETE CASCADE,
  entry_fee_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency char(3) NOT NULL DEFAULT 'USD',
  approval_mode text NOT NULL DEFAULT 'manual',
  payment_required_before_approval boolean NOT NULL DEFAULT false,
  refund_policy text,
  allow_waitlist boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tournament_finance_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read tournament_finance_settings" ON public.tournament_finance_settings;
CREATE POLICY "Allow authenticated read tournament_finance_settings"
  ON public.tournament_finance_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write tournament_finance_settings" ON public.tournament_finance_settings;
CREATE POLICY "Allow authenticated write tournament_finance_settings"
  ON public.tournament_finance_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 2) Finance accounts (cash/bank/wallet + receivable bucket + placeholders for future)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  name text NOT NULL,
  account_type text NOT NULL CHECK (
    account_type IN (
      'cash','bank','wallet',
      'receivable','income',
      'expense','payable',
      'advance_credit'
    )
  ),
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tournament_id, account_type)
);

ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read finance_accounts" ON public.finance_accounts;
CREATE POLICY "Allow authenticated read finance_accounts"
  ON public.finance_accounts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write finance_accounts" ON public.finance_accounts;
CREATE POLICY "Allow authenticated write finance_accounts"
  ON public.finance_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 3) Team-fee receivables (expected/remaining)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_entry_id uuid NOT NULL REFERENCES public.team_entries(id) ON DELETE CASCADE,
  amount_due numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  amount_waived numeric(12,2) NOT NULL DEFAULT 0,
  amount_remaining numeric(12,2) NOT NULL DEFAULT 0,
  due_at timestamptz,
  status text NOT NULL CHECK (
    status IN ('draft','open','partial','paid','overdue','waived','written_off','void')
  ) DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tournament_id, team_entry_id)
);

ALTER TABLE public.finance_receivables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read finance_receivables" ON public.finance_receivables;
CREATE POLICY "Allow authenticated read finance_receivables"
  ON public.finance_receivables FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write finance_receivables" ON public.finance_receivables;
CREATE POLICY "Allow authenticated write finance_receivables"
  ON public.finance_receivables FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4) Payments against receivables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  receivable_id uuid NOT NULL REFERENCES public.finance_receivables(id) ON DELETE CASCADE,
  team_entry_id uuid NOT NULL REFERENCES public.team_entries(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  account_id uuid NOT NULL REFERENCES public.finance_accounts(id) ON DELETE RESTRICT,
  reference text,
  notes text,
  proof_url text,
  status text NOT NULL CHECK (status IN ('posted','void','reversed')) DEFAULT 'posted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read finance_payments" ON public.finance_payments;
CREATE POLICY "Allow authenticated read finance_payments"
  ON public.finance_payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write finance_payments" ON public.finance_payments;
CREATE POLICY "Allow authenticated write finance_payments"
  ON public.finance_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 5) Minimal ledger (journals + lines) for traceability
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_ledger_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  journal_type text NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','void','reversed')),
  posted_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.finance_ledger_journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read finance_ledger_journals" ON public.finance_ledger_journals;
CREATE POLICY "Allow authenticated read finance_ledger_journals"
  ON public.finance_ledger_journals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write finance_ledger_journals" ON public.finance_ledger_journals;
CREATE POLICY "Allow authenticated write finance_ledger_journals"
  ON public.finance_ledger_journals FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.finance_ledger_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid NOT NULL REFERENCES public.finance_ledger_journals(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.finance_accounts(id) ON DELETE RESTRICT,
  side text NOT NULL CHECK (side IN ('debit','credit')),
  amount numeric(12,2) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.finance_ledger_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read finance_ledger_lines" ON public.finance_ledger_lines;
CREATE POLICY "Allow authenticated read finance_ledger_lines"
  ON public.finance_ledger_lines FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write finance_ledger_lines" ON public.finance_ledger_lines;
CREATE POLICY "Allow authenticated write finance_ledger_lines"
  ON public.finance_ledger_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 6) Placeholder tables for other tabs (empty states will be accurate)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  vendor text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  account_id uuid REFERENCES public.finance_accounts(id),
  reference text,
  notes text,
  status text NOT NULL CHECK (status IN ('draft','posted','paid','void','reversed')) DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read finance_expenses" ON public.finance_expenses;
CREATE POLICY "Allow authenticated read finance_expenses" ON public.finance_expenses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write finance_expenses" ON public.finance_expenses;
CREATE POLICY "Allow authenticated write finance_expenses" ON public.finance_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.finance_payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text,
  payee text,
  amount_due numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  amount_remaining numeric(12,2) NOT NULL DEFAULT 0,
  due_at timestamptz,
  status text NOT NULL CHECK (status IN ('draft','open','partial','paid','overdue','void')) DEFAULT 'open',
  account_id uuid REFERENCES public.finance_accounts(id),
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.finance_payables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read finance_payables" ON public.finance_payables;
CREATE POLICY "Allow authenticated read finance_payables" ON public.finance_payables FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write finance_payables" ON public.finance_payables;
CREATE POLICY "Allow authenticated write finance_payables" ON public.finance_payables FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.finance_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  income_type text NOT NULL DEFAULT 'misc',
  source_name text,
  reference text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  account_id uuid REFERENCES public.finance_accounts(id),
  linked_team_entry_id uuid REFERENCES public.team_entries(id),
  notes text,
  status text NOT NULL CHECK (status IN ('draft','posted','void','reversed')) DEFAULT 'posted',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.finance_income ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read finance_income" ON public.finance_income;
CREATE POLICY "Allow authenticated read finance_income" ON public.finance_income FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write finance_income" ON public.finance_income;
CREATE POLICY "Allow authenticated write finance_income" ON public.finance_income FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.finance_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  from_account_id uuid REFERENCES public.finance_accounts(id),
  to_account_id uuid REFERENCES public.finance_accounts(id),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  reference text,
  notes text,
  status text NOT NULL CHECK (status IN ('draft','posted','void')) DEFAULT 'posted',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.finance_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read finance_transfers" ON public.finance_transfers;
CREATE POLICY "Allow authenticated read finance_transfers"
  ON public.finance_transfers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow authenticated write finance_transfers" ON public.finance_transfers;
CREATE POLICY "Allow authenticated write finance_transfers"
  ON public.finance_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

