-- 1. Create User Profiles Table
create table public.user_profiles (
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
  
  -- Expenses
  monthly_expense numeric default 0,
  rent_paid_monthly numeric default 0,
  health_insurance_premium numeric default 0,
  
  -- Assets & Investments
  current_savings numeric default 0,
  emergency_fund numeric default 0,
  deduction_80c numeric default 0,
  deduction_80d numeric default 0,
  nps_80ccd numeric default 0,
  
  -- Liabilities
  home_loan_emi numeric default 0,
  home_loan_interest_annual numeric default 0,
  credit_card_debt numeric default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id)
);

-- 2. Create Tax Calculations Table
create table public.tax_calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  financial_year text not null,
  
  -- Inputs
  salary numeric not null,
  hra_received numeric default 0,
  rent_paid numeric default 0,
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

-- 3. Create FIRE Plans Table
create table public.fire_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  
  current_age integer not null,
  retire_age integer not null,
  corpus_needed numeric not null,
  sip_per_month numeric not null,
  feasibility text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id)
);

-- Enable RLS (Row Level Security)
alter table public.user_profiles enable row level security;
alter table public.tax_calculations enable row level security;
alter table public.fire_plans enable row level security;

-- Create Policies so users can only view and edit their own data
create policy "Users can view their own profile" on public.user_profiles for select using (auth.uid() = user_id);
create policy "Users can insert their own profile" on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update their own profile" on public.user_profiles for update using (auth.uid() = user_id);
create policy "Users can delete their own profile" on public.user_profiles for delete using (auth.uid() = user_id);

create policy "Users can view their own tax calculations" on public.tax_calculations for select using (auth.uid() = user_id);
create policy "Users can insert their own tax calculations" on public.tax_calculations for insert with check (auth.uid() = user_id);
create policy "Users can update their own tax calculations" on public.tax_calculations for update using (auth.uid() = user_id);
create policy "Users can delete their own tax calculations" on public.tax_calculations for delete using (auth.uid() = user_id);

create policy "Users can view their own FIRE plans" on public.fire_plans for select using (auth.uid() = user_id);
create policy "Users can insert their own FIRE plans" on public.fire_plans for insert with check (auth.uid() = user_id);
create policy "Users can update their own FIRE plans" on public.fire_plans for update using (auth.uid() = user_id);
create policy "Users can delete their own FIRE plans" on public.fire_plans for delete using (auth.uid() = user_id);
