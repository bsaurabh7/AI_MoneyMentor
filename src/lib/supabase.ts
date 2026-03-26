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
  date_of_birth: string | null;   // ISO date string e.g. "2000-01-15"
  city_type: 'metro' | 'non-metro' | null;
  annual_income: number | null;
  monthly_expense: number | null;
  current_savings: number | null;
  risk_profile: 'conservative' | 'moderate' | 'aggressive' | null;
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
  created_at: string;
};
