// ── Comprehensive Financial Profile Data Model ─────────────────────────────
// All 26+ fields from the blueprint, split into 5 typed sub-objects.
// Phase 1 (wizard) collects the top fields; Phase 2 (chat) fills the rest.

export interface Demographics {
  employment_type?: 'salaried' | 'self-employed' | 'student' | 'unemployed' | 'retired';
  age?: number;
  city_type?: 'metro' | 'non-metro' | 'rural';
  marital_status?: 'single' | 'married';
  /** If married — is the spouse earning? */
  spouse_earning?: boolean;
  /** Number of dependent children + parents */
  dependents?: number;
}

export interface IncomeStreams {
  /** Annual CTC / gross salary or avg monthly business profit × 12 */
  base_salary?: number;
  /** HRA component from salary slip (annual) */
  hra_received?: number;
  /** LTA received (annual) */
  lta_received?: number;
  /** Standard deduction — fixed at ₹50,000 for salaried */
  standard_deduction?: number;
  /** Spouse annual income (if applicable) */
  spouse_income?: number;
  /** Freelance / side-hustle monthly average */
  secondary_income_monthly?: number;
  /** Rental income monthly */
  rental_income_monthly?: number;
  /** Dividend + FD interest income monthly */
  passive_income_monthly?: number;
  /** Expected annual income growth % */
  income_growth_pct?: number;
}

export interface Expenses {
  /** Monthly rent paid */
  rent_paid_monthly?: number;
  /** Fixed monthly: groceries, utilities, school fees */
  fixed_monthly?: number;
  /** Discretionary: dining, travel, entertainment */
  discretionary_monthly?: number;
  /** Annual health insurance premium (→ 80D deduction) */
  health_insurance_premium?: number;
  /** Annual term/life insurance premium */
  life_insurance_premium?: number;
}

export interface Assets {
  /** Total 80C investments: EPF + PPF + ELSS + LIC (capped at ₹1.5L) */
  deduction_80c?: number;
  /** NPS contribution under 80CCD(1B) — extra ₹50K deduction */
  nps_80ccd?: number;
  /** Standard 80D (health insurance) deduction amount */
  deduction_80d?: number;
  /** Emergency fund in savings accounts / FDs */
  emergency_fund?: number;
  /** Mutual funds + stocks + bonds market value */
  mutual_funds_stocks?: number;
  /** Real estate market value (excl. primary residence) */
  real_estate_value?: number;
  /** Gold + other physical assets */
  gold_other?: number;
}

export interface Liabilities {
  /** Total monthly home loan EMI */
  home_loan_emi?: number;
  /** Interest portion of home loan EMI (annual, → Section 24b, max ₹2L) */
  home_loan_interest_annual?: number;
  /** Monthly car loan EMI */
  car_loan_emi?: number;
  /** Total credit card outstanding balance */
  credit_card_debt?: number;
  /** Personal loan + other EMIs per month */
  other_emis_monthly?: number;
}

/** Root collected data object — all fields optional (progressive filling) */
export interface CollectedData {
  demographics?: Demographics;
  income?: IncomeStreams;
  expenses?: Expenses;
  assets?: Assets;
  liabilities?: Liabilities;
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
  return Math.min(d.assets?.deduction_80d ?? 25_000, 25_000);
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
