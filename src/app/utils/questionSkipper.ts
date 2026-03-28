import type { CollectedData } from '../hooks/useCollectedData';

type ConversationStep =
  | 'salary' | 'rent' | 'hra' | 'deduction80c' | 'deduction80d' | 'nps'
  | 'tax_computing' | 'ask_fire'
  | 'fire_age' | 'fire_retire_age_only' | 'fire_expenses' | 'fire_discretionary'
  | 'fire_savings' | 'fire_expected_return' | 'fire_computing'
  | 'p2_secondary_income' | 'p2_epf' | 'p2_passive_income'
  | 'p2_term_insurance' | 'p2_insurance' | 'p2_home_loan' | 'p2_home_loan_interest'
  | 'p2_credit_card' | 'p2_emergency_months' | 'p2_sip' | 'p2_total_investments'
  | 'p2_tax_regime'
  | 'portfolio_intro' | 'portfolio_fund_name' | 'portfolio_fund_invested'
  | 'portfolio_fund_value' | 'portfolio_fund_category' | 'portfolio_confirm'
  | 'done';

// Steps that cannot be auto-skipped (they are transition/compute states)
const UNSKIPPABLE: ConversationStep[] = [
  'tax_computing', 'fire_computing', 'ask_fire', 'portfolio_intro',
  'portfolio_fund_name', 'portfolio_fund_invested', 'portfolio_fund_value',
  'portfolio_fund_category', 'portfolio_confirm', 'done',
];

/**
 * Returns true if the given step already has an answer in `collected`.
 */
export function isStepAnswered(step: ConversationStep, collected: CollectedData): boolean {
  if (UNSKIPPABLE.includes(step)) return false;
  const d = collected;
  switch (step) {
    case 'salary':              return !!d.income?.base_salary;
    case 'rent':                return d.expenses?.rent_paid_monthly !== undefined;
    case 'hra':                 return d.income?.hra_received !== undefined;
    case 'deduction80c':        return d.assets?.deduction_80c !== undefined;
    case 'deduction80d':        return d.assets?.deduction_80d !== undefined;
    case 'nps':                 return d.assets?.nps_80ccd !== undefined;
    case 'fire_age':            return !!d.demographics?.age;
    case 'fire_retire_age_only':return !!d.demographics?.target_retirement_age;
    case 'fire_expenses':       return !!d.expenses?.fixed_monthly;
    case 'fire_discretionary':  return d.expenses?.discretionary_monthly !== undefined;
    case 'fire_savings':        return d.assets?.current_savings !== undefined;
    case 'fire_expected_return':return !!d.assets?.expected_return;
    case 'p2_secondary_income': return d.income?.secondary_income_monthly !== undefined;
    case 'p2_epf':              return d.income?.epf_monthly !== undefined;
    case 'p2_passive_income':   return d.income?.passive_income_monthly !== undefined;
    case 'p2_term_insurance':   return d.assets?.has_term_insurance !== undefined;
    case 'p2_insurance':        return d.assets?.has_health_insurance !== undefined;
    case 'p2_home_loan':        return d.liabilities?.home_loan_emi !== undefined;
    case 'p2_home_loan_interest': return d.liabilities?.home_loan_interest_annual !== undefined;
    case 'p2_credit_card':      return d.liabilities?.credit_card_debt !== undefined;
    case 'p2_emergency_months': return !!d.assets?.emergency_months;
    case 'p2_sip':              return d.assets?.monthly_sip !== undefined;
    case 'p2_total_investments':return d.assets?.total_investments !== undefined;
    case 'p2_tax_regime':       return d.assets?.tax_regime_chosen !== undefined;
    default:                    return false;
  }
}

// Ordered list of skippable steps
const STEP_ORDER: ConversationStep[] = [
  'salary', 'rent', 'hra', 'deduction80c', 'deduction80d', 'nps',
  'tax_computing', 'ask_fire',
  'fire_age', 'fire_retire_age_only', 'fire_expenses', 'fire_discretionary',
  'fire_savings', 'fire_expected_return', 'fire_computing',
  'p2_secondary_income', 'p2_epf', 'p2_passive_income',
  'p2_term_insurance', 'p2_insurance', 'p2_home_loan', 'p2_home_loan_interest',
  'p2_credit_card', 'p2_emergency_months', 'p2_sip', 'p2_total_investments',
  'p2_tax_regime',
  'portfolio_intro', 'done',
];

/**
 * Given the current step and collected data, returns the first unanswered step
 * at or after the current position. Returns the current step unchanged if it is
 * unskippable or already unanswered.
 */
export function getNextUnansweredStep(
  currentStep: ConversationStep,
  collected: CollectedData
): ConversationStep {
  if (!isStepAnswered(currentStep, collected)) return currentStep;

  const idx = STEP_ORDER.indexOf(currentStep);
  for (let i = idx + 1; i < STEP_ORDER.length; i++) {
    if (!isStepAnswered(STEP_ORDER[i], collected)) return STEP_ORDER[i];
  }
  return 'done';
}




