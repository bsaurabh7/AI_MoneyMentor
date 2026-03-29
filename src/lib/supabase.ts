/**
 * Arthmize — Supabase Browser Client
 * ─────────────────────────────────────────────────────────────
 * Single shared client for all frontend auth & data operations.
 * Uses the publishable (anon) key — protected by RLS policies.
 *
 * Server-side / admin operations that bypass RLS must use a
 * separate client built with SUPABASE_SERVICE_ROLE_KEY and
 * must NEVER be instantiated in this file or any browser bundle.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[Arthmize] Missing Supabase env vars.\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Persist session in localStorage (safe for anon key / RLS-protected data)
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Redirect after email confirmation
    flowType: 'pkce',
  },
});

/* ── Database table type aliases (mirrors the SQL schema) ── */
export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  city_type: 'metro' | 'non-metro' | null;
  employment_type: string | null;
  marital_status: string | null;
  annual_income: number | null;
  hra_received: number | null;
  secondary_income_monthly: number | null;
  passive_income_monthly: number | null;
  monthly_expense: number | null;
  rent_paid_monthly: number | null;
  health_insurance_premium: number | null;
  current_savings: number | null;
  emergency_fund: number | null;
  deduction_80c: number | null;
  deduction_80d: number | null;
  nps_80ccd: number | null;
  home_loan_emi: number | null;
  home_loan_interest_annual: number | null;
  credit_card_debt: number | null;
  risk_profile: 'conservative' | 'moderate' | 'aggressive' | null;
  monthly_sip: number | null;
  total_investments: number | null;
  epf_monthly: number | null;
  has_term_insurance: boolean | null;
  term_insurance_name: string | null;
  term_insurance_premium: number | null;
  term_insurance_start_year: number | null;
  term_insurance_end_year: number | null;
  has_health_insurance: boolean | null;
  health_insurance_name: string | null;
  health_insurance_start_year: number | null;
  health_insurance_end_year: number | null;
  tax_regime_chosen: boolean | null;
  expected_return: number | null;
  emergency_months: string | null;
  updated_at: string;
};

export type TaxCalculation = {
  id: string;
  user_id: string;
  financial_year: string;
  salary: number;
  hra_received: number;
  rent_paid: number;
  deduction_80c: number;
  deduction_80d: number;
  nps_80ccd: number;
  old_regime_tax: number;
  new_regime_tax: number;
  recommended_regime: 'old' | 'new';
  savings_amount: number;
  ai_reasoning: string | null;
  created_at: string;
};

export type FirePlan = {
  id: string;
  user_id: string;
  current_age: number;
  retire_age: number;
  corpus_needed: number;
  sip_per_month: number;
  feasibility: 'on track' | 'stretch goal' | 'needs revision';
  ai_reasoning: string | null;
  created_at: string;
};

export type HealthScore = {
  id: string;
  user_id: string;
  overall_score: number;
  emergency_score: number;
  insurance_score: number;
  investment_score: number;
  debt_score: number;
  tax_score: number;
  retirement_score: number;
  
  // Raw inputs
  emergency_months: string | null;
  has_term_insurance: boolean | null;
  has_health_insurance: boolean | null;
  monthly_sip: number | null;
  total_investments: number | null;
  has_home_loan: boolean | null;
  monthly_emi: number | null;
  tax_regime_optimized: boolean | null;
  annual_income: number | null;
  epf_nps_contribution: number | null;
  
  created_at: string;
};
