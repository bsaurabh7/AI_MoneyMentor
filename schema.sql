-- Arthmize Schema — Run this ENTIRE script in Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS

-- ════════════════════════════════════════════════════════
-- 1. USER PROFILES TABLE
-- ════════════════════════════════════════════════════════
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,

  -- Demographics
  date_of_birth date,
  city_type text check (city_type in ('metro', 'non-metro', 'rural')),
  employment_type text check (employment_type in ('salaried', 'self-employed', 'student', 'unemployed', 'retired')),
  marital_status text check (marital_status in ('single', 'married')),
  dependents integer default 0,

  -- Income
  annual_income numeric,
  hra_received numeric default 0,
  secondary_income_monthly numeric default 0,
  passive_income_monthly numeric default 0,
  epf_monthly numeric default 0,

  -- Expenses
  monthly_expense numeric default 0,
  rent_paid_monthly numeric default 0,
  health_insurance_premium numeric default 0,

  -- Assets & Investments
  current_savings numeric default 0,
  emergency_fund numeric default 0,
  monthly_sip numeric default 0,
  total_investments numeric default 0,
  deduction_80c numeric default 0,
  deduction_80d numeric default 0,
  nps_80ccd numeric default 0,

  -- Liabilities
  home_loan_emi numeric default 0,
  home_loan_interest_annual numeric default 0,
  credit_card_debt numeric default 0,

  -- Health / Profile metadata
  emergency_months text check (emergency_months in ('<1', '1-3', '3-6', '>6')),
  has_term_insurance boolean default false,
  has_health_insurance boolean default true,
  tax_regime_chosen boolean,
  expected_return numeric default 0.12,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(user_id)
);

-- ════════════════════════════════════════════════════════
-- 2. TAX CALCULATIONS TABLE
-- ════════════════════════════════════════════════════════
create table if not exists public.tax_calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  financial_year text not null,

  -- Inputs
  salary numeric not null,
  hra_received numeric default 0,
  rent_paid numeric default 0,
  city_type text,
  deduction_80c numeric default 0,
  deduction_80d numeric default 0,
  nps_80ccd numeric default 0,

  -- Results
  old_regime_tax numeric not null,
  new_regime_tax numeric not null,
  recommended_regime text check (recommended_regime in ('old', 'new')) not null,
  savings_amount numeric not null,
  ai_reasoning text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(user_id, financial_year)
);

-- ════════════════════════════════════════════════════════
-- 3. FIRE PLANS TABLE
-- ════════════════════════════════════════════════════════
create table if not exists public.fire_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,

  current_age integer not null,
  retire_age integer not null,
  corpus_needed numeric not null,
  sip_per_month numeric not null,
  feasibility text check (feasibility in ('on track', 'stretch goal', 'needs revision')),
  annual_expense_at_retire numeric,
  expected_return numeric default 0.12,
  chart_data jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(user_id)
);

-- ════════════════════════════════════════════════════════
-- 4. HEALTH SCORES TABLE (NEW)
-- ════════════════════════════════════════════════════════
create table if not exists public.health_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,

  overall_score integer,
  emergency_score integer,
  insurance_score integer,
  investment_score integer,
  debt_score integer,
  tax_score integer,
  retirement_score integer,

  -- Raw inputs used to calculate the score
  emergency_months text,
  has_term_insurance boolean,
  has_health_insurance boolean,
  monthly_sip numeric default 0,
  total_investments numeric default 0,
  has_home_loan boolean,
  monthly_emi numeric default 0,
  tax_regime_optimized boolean,
  annual_income numeric default 0,
  epf_nps_contribution numeric default 0,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(user_id)
);

-- ════════════════════════════════════════════════════════
-- 5. PORTFOLIO FUNDS TABLE (NEW)
-- ════════════════════════════════════════════════════════
create table if not exists public.portfolio_funds (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,

  fund_name text not null,
  sip_amount numeric not null,
  sip_start_date text not null,
  amount_invested numeric not null,
  current_value numeric not null,
  category text check (category in ('large_cap','mid_cap','small_cap','flexi_cap','elss','debt','international')),

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ════════════════════════════════════════════════════════
-- 6. PORTFOLIO ANALYSIS TABLE (NEW)
-- ════════════════════════════════════════════════════════
create table if not exists public.portfolio_analysis (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,

  total_invested numeric,
  total_current numeric,
  xirr numeric,
  avg_expense_ratio numeric,
  benchmark_return numeric,
  overlap_severity text check (overlap_severity in ('low','medium','high')),
  overlap_matrix jsonb,
  allocation jsonb,
  ai_reasoning text,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(user_id)
);

-- ════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════
alter table public.user_profiles enable row level security;
alter table public.tax_calculations enable row level security;
alter table public.fire_plans enable row level security;
alter table public.health_scores enable row level security;
alter table public.portfolio_funds enable row level security;
alter table public.portfolio_analysis enable row level security;
alter table public.tax_calculations add column if not exists city_type text;

-- user_profiles policies
drop policy if exists "Users can view their own profile" on public.user_profiles;
drop policy if exists "Users can insert their own profile" on public.user_profiles;
drop policy if exists "Users can update their own profile" on public.user_profiles;
drop policy if exists "Users can delete their own profile" on public.user_profiles;
create policy "Users can view their own profile" on public.user_profiles for select using (auth.uid() = user_id);
create policy "Users can insert their own profile" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own profile" on public.user_profiles for update using (auth.uid() = user_id);
create policy "Users can delete their own profile" on public.user_profiles for delete using (auth.uid() = user_id);

-- tax_calculations policies
drop policy if exists "Users can view their own tax calculations" on public.tax_calculations;
drop policy if exists "Users can insert their own tax calculations" on public.tax_calculations;
drop policy if exists "Users can update their own tax calculations" on public.tax_calculations;
drop policy if exists "Users can delete their own tax calculations" on public.tax_calculations;
create policy "Users can view their own tax calculations" on public.tax_calculations for select using (auth.uid() = user_id);
create policy "Users can insert their own tax calculations" on public.tax_calculations for insert with check (auth.uid() = user_id);
create policy "Users can update their own tax calculations" on public.tax_calculations for update using (auth.uid() = user_id);
create policy "Users can delete their own tax calculations" on public.tax_calculations for delete using (auth.uid() = user_id);

-- fire_plans policies
drop policy if exists "Users can view their own FIRE plans" on public.fire_plans;
drop policy if exists "Users can insert their own FIRE plans" on public.fire_plans;
drop policy if exists "Users can update their own FIRE plans" on public.fire_plans;
drop policy if exists "Users can delete their own FIRE plans" on public.fire_plans;
create policy "Users can view their own FIRE plans" on public.fire_plans for select using (auth.uid() = user_id);
create policy "Users can insert their own FIRE plans" on public.fire_plans for insert with check (auth.uid() = user_id);
create policy "Users can update their own FIRE plans" on public.fire_plans for update using (auth.uid() = user_id);
create policy "Users can delete their own FIRE plans" on public.fire_plans for delete using (auth.uid() = user_id);

-- health_scores policies
create policy "Users can view their own health scores" on public.health_scores for select using (auth.uid() = user_id);
create policy "Users can insert their own health scores" on public.health_scores for insert with check (auth.uid() = user_id);
create policy "Users can update their own health scores" on public.health_scores for update using (auth.uid() = user_id);
create policy "Users can delete their own health scores" on public.health_scores for delete using (auth.uid() = user_id);

-- portfolio_funds policies
create policy "Users can view their own portfolio funds" on public.portfolio_funds for select using (auth.uid() = user_id);
create policy "Users can insert their own portfolio funds" on public.portfolio_funds for insert with check (auth.uid() = user_id);
create policy "Users can update their own portfolio funds" on public.portfolio_funds for update using (auth.uid() = user_id);
create policy "Users can delete their own portfolio funds" on public.portfolio_funds for delete using (auth.uid() = user_id);

-- portfolio_analysis policies
create policy "Users can view their own portfolio analysis" on public.portfolio_analysis for select using (auth.uid() = user_id);
create policy "Users can insert their own portfolio analysis" on public.portfolio_analysis for insert with check (auth.uid() = user_id);
create policy "Users can update their own portfolio analysis" on public.portfolio_analysis for update using (auth.uid() = user_id);
create policy "Users can delete their own portfolio analysis" on public.portfolio_analysis for delete using (auth.uid() = user_id);


-- ===============================
--         Chat Session
-- ===============================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_step TEXT NOT NULL,
  collected_data JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);



-- Adds missing analytics and profile tracking columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS secondary_income_monthly numeric default 0,
ADD COLUMN IF NOT EXISTS passive_income_monthly numeric default 0,
ADD COLUMN IF NOT EXISTS epf_monthly numeric default 0,
ADD COLUMN IF NOT EXISTS current_savings numeric default 0,
ADD COLUMN IF NOT EXISTS emergency_fund numeric default 0,
ADD COLUMN IF NOT EXISTS monthly_sip numeric default 0,
ADD COLUMN IF NOT EXISTS total_investments numeric default 0,
ADD COLUMN IF NOT EXISTS deduction_80c numeric default 0,
ADD COLUMN IF NOT EXISTS deduction_80d numeric default 0,
ADD COLUMN IF NOT EXISTS nps_80ccd numeric default 0,
ADD COLUMN IF NOT EXISTS home_loan_emi numeric default 0,
ADD COLUMN IF NOT EXISTS home_loan_interest_annual numeric default 0,
ADD COLUMN IF NOT EXISTS credit_card_debt numeric default 0,
ADD COLUMN IF NOT EXISTS emergency_months text check (emergency_months in ('<1', '1-3', '3-6', '>6')),
ADD COLUMN IF NOT EXISTS has_term_insurance boolean default false,
ADD COLUMN IF NOT EXISTS has_health_insurance boolean default true,
ADD COLUMN IF NOT EXISTS tax_regime_chosen boolean,
ADD COLUMN IF NOT EXISTS expected_return numeric default 0.12;

ALTER TABLE public.health_scores
ADD COLUMN IF NOT EXISTS has_health_insurance boolean,
ADD COLUMN IF NOT EXISTS has_home_loan boolean,
ADD COLUMN IF NOT EXISTS monthly_emi numeric default 0,
ADD COLUMN IF NOT EXISTS tax_regime_optimized boolean,
ADD COLUMN IF NOT EXISTS annual_income numeric default 0,
ADD COLUMN IF NOT EXISTS epf_nps_contribution numeric default 0;

ALTER TABLE public.portfolio_funds
DROP COLUMN IF EXISTS session_id,
ADD COLUMN IF NOT EXISTS sip_amount numeric default 0,
ADD COLUMN IF NOT EXISTS sip_start_date text default '2024-01';

ALTER TABLE public.portfolio_analysis
DROP COLUMN IF EXISTS session_id;
-- Note: Manually drop old unique constraint for unique(user_id, session_id) and add unique(user_id) if needed on live dbs.

-- Force Schema Cache reload
NOTIFY pgrst, 'reload schema';

create table if not exists fire_recommendations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  risk_profile text not null,
  status       text not null default 'pending',
  fetched_at   timestamptz default now(),
  expires_at   timestamptz,
  sip_funds    jsonb,
  insurance    jsonb,
  ai_summary   text,
  unique(user_id, risk_profile)
);
alter table fire_recommendations enable row level security;
create policy "own_fire_recs" on fire_recommendations
  for all using (auth.uid() = user_id);


-- 1. Remove the old multi-column constraint that is blocking the upsert
ALTER TABLE public.portfolio_analysis 
DROP CONSTRAINT IF EXISTS portfolio_analysis_user_id_session_id_key;

-- 2. Add the clean unique constraint on user_id
ALTER TABLE public.portfolio_analysis 
ADD CONSTRAINT portfolio_analysis_user_id_key UNIQUE (user_id);

-- 3. Ensure the check constraint accepts our values
ALTER TABLE public.portfolio_analysis 
DROP CONSTRAINT IF EXISTS portfolio_analysis_overlap_severity_check;

ALTER TABLE public.portfolio_analysis 
ADD CONSTRAINT portfolio_analysis_overlap_severity_check 
CHECK (overlap_severity IN ('low', 'medium', 'high'));
