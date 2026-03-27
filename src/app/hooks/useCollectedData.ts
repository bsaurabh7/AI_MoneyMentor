// ── Comprehensive Financial Profile Data Model v2.0 ─────────────────────────
// All fields from the v2.0 blueprint, split into typed sub-objects.
// Phase 1 (wizard) collects top fields; Phase 2 (chat) fills the rest.

export interface Demographics {
  employment_type?: 'salaried' | 'self-employed' | 'student' | 'unemployed' | 'retired';
  age?: number;
  city_type?: 'metro' | 'non-metro' | 'rural';
  marital_status?: 'single' | 'married';
  spouse_earning?: boolean;
  dependents?: number;
  target_retirement_age?: number;
}

export interface IncomeStreams {
  base_salary?: number;
  hra_received?: number;
  lta_received?: number;
  standard_deduction?: number;
  spouse_income?: number;
  secondary_income_monthly?: number;
  rental_income_monthly?: number;
  passive_income_monthly?: number;
  income_growth_pct?: number;
  epf_monthly?: number;
}

export interface Expenses {
  rent_paid_monthly?: number;
  fixed_monthly?: number;
  discretionary_monthly?: number;
  health_insurance_premium?: number;
  life_insurance_premium?: number;
}

export interface Assets {
  deduction_80c?: number;
  nps_80ccd?: number;
  deduction_80d?: number;
  emergency_fund?: number;
  mutual_funds_stocks?: number;
  real_estate_value?: number;
  gold_other?: number;
  current_savings?: number;
  // v2.0 additions
  monthly_sip?: number;
  total_investments?: number;
  emergency_months?: '<1' | '1-3' | '3-6' | '>6';
  has_term_insurance?: boolean;
  has_health_insurance?: boolean;
  tax_regime_chosen?: boolean;
  expected_return?: number; // decimal e.g. 0.12 for 12%
}

export interface Liabilities {
  home_loan_emi?: number;
  home_loan_interest_annual?: number;
  car_loan_emi?: number;
  credit_card_debt?: number;
  other_emis_monthly?: number;
}

/** A mutual fund in the portfolio */
export interface PortfolioFund {
  name: string;
  amount_invested: number;
  current_value: number;
  category: 'large_cap' | 'mid_cap' | 'small_cap' | 'flexi_cap' | 'elss' | 'debt' | 'international';
}

/** Root collected data object — all fields optional (progressive filling) */
export interface CollectedData {
  demographics?: Demographics;
  income?: IncomeStreams;
  expenses?: Expenses;
  assets?: Assets;
  liabilities?: Liabilities;
  portfolio?: PortfolioFund[];
}

// ── Convenience flat getters ───────────────────────────────────────────────

export function getSalary(d: CollectedData): number {
  return d.income?.base_salary ?? 0;
}

export function getHRA(d: CollectedData): number {
  return d.income?.hra_received ?? 0;
}

export function getRent(d: CollectedData): number {
  return (d.expenses?.rent_paid_monthly ?? 0) * 12;
}

export function getCityType(d: CollectedData): 'metro' | 'non-metro' {
  return d.demographics?.city_type === 'metro' ? 'metro' : 'non-metro';
}

export function get80C(d: CollectedData): number {
  return Math.min(d.assets?.deduction_80c ?? 0, 150_000);
}

export function get80D(d: CollectedData): number {
  return Math.min(d.assets?.deduction_80d ?? 0, 25_000);
}

export function getNPS(d: CollectedData): number {
  return Math.min(d.assets?.nps_80ccd ?? 0, 50_000);
}

export function getCurrentAge(d: CollectedData): number {
  return d.demographics?.age ?? 30;
}

/** Total monthly outflow for FIRE calculations */
export function getTotalMonthlyExpense(d: CollectedData): number {
  return (
    (d.expenses?.rent_paid_monthly ?? 0) +
    (d.expenses?.fixed_monthly ?? 0) +
    (d.expenses?.discretionary_monthly ?? 0) +
    (d.liabilities?.home_loan_emi ?? 0) +
    (d.liabilities?.car_loan_emi ?? 0) +
    (d.liabilities?.other_emis_monthly ?? 0)
  );
}

/** Total debt for health score */
export function getTotalDebt(d: CollectedData): number {
  const l = d.liabilities;
  if (!l) return 0;
  return (
    (l.home_loan_emi ?? 0) * 12 +
    (l.car_loan_emi ?? 0) * 12 +
    (l.credit_card_debt ?? 0) +
    (l.other_emis_monthly ?? 0) * 12
  );
}

/** Get expected return as a percentage number (e.g. 12 for 12%) */
export function getExpectedReturn(d: CollectedData): number {
  const r = d.assets?.expected_return;
  if (!r) return 12;
  // if stored as decimal (0.12), convert to percentage (12)
  return r <= 1 ? r * 100 : r;
}
