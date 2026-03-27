import { useState, useCallback } from 'react';
import type { CollectedData, Demographics, IncomeStreams, Expenses, Assets } from './useCollectedData';

// ── Wizard Steps ───────────────────────────────────────────────────────────
export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export const WIZARD_STEPS = [
  { id: 0, label: 'Employment',  icon: '💼', title: 'What do you do?',                    subtitle: 'This helps us tailor tax rules for you.' },
  { id: 1, label: 'Profile',     icon: '👤', title: 'Tell us about yourself',              subtitle: 'Age, city and family status shape your plan.' },
  { id: 2, label: 'Income',      icon: '₹',  title: "What's your annual income?",          subtitle: 'Enter your CTC or average business earnings.' },
  { id: 3, label: 'Allowances',  icon: '🏠', title: 'Housing & allowances',               subtitle: 'Needed to calculate your HRA tax exemption.' },
  { id: 4, label: 'Investments', icon: '📈', title: 'Tax-saving investments',              subtitle: 'We\'ll see how much tax you can legally save.' },
  { id: 5, label: 'Review',      icon: '✅', title: 'Everything looks good!',              subtitle: 'Confirm your details to get your personalized plan.' },
] as const;

export const TOTAL_STEPS = WIZARD_STEPS.length;

// ── Wizard State ───────────────────────────────────────────────────────────
export interface WizardState {
  step: WizardStep;
  data: CollectedData;
  isComplete: boolean;
}

const INITIAL_STATE: WizardState = {
  step: 0,
  data: {},
  isComplete: false,
};

// ── Hook ───────────────────────────────────────────────────────────────────
export function useProfileWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  // ── Field setters ──────────────────────────────────────────────────────
  const setDemographics = useCallback((patch: Partial<Demographics>) => {
    setState((s) => ({
      ...s,
      data: {
        ...s.data,
        demographics: { ...s.data.demographics, ...patch },
      },
    }));
  }, []);

  const setIncome = useCallback((patch: Partial<IncomeStreams>) => {
    setState((s) => ({
      ...s,
      data: {
        ...s.data,
        income: { ...s.data.income, ...patch },
      },
    }));
  }, []);

  const setExpenses = useCallback((patch: Partial<Expenses>) => {
    setState((s) => ({
      ...s,
      data: {
        ...s.data,
        expenses: { ...s.data.expenses, ...patch },
      },
    }));
  }, []);

  const setAssets = useCallback((patch: Partial<Assets>) => {
    setState((s) => ({
      ...s,
      data: {
        ...s.data,
        assets: { ...s.data.assets, ...patch },
      },
    }));
  }, []);

  // ── Navigation ─────────────────────────────────────────────────────────
  const next = useCallback(() => {
    setState((s) => {
      const nextStep = Math.min(s.step + 1, TOTAL_STEPS - 1) as WizardStep;
      return { ...s, step: nextStep };
    });
  }, []);

  const prev = useCallback(() => {
    setState((s) => {
      const prevStep = Math.max(s.step - 1, 0) as WizardStep;
      return { ...s, step: prevStep };
    });
  }, []);

  const complete = useCallback(() => {
    setState((s) => ({ ...s, isComplete: true }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ── Validation per step ────────────────────────────────────────────────
  const canProceed = (step: WizardStep, data: CollectedData): boolean => {
    switch (step) {
      case 0: return !!data.demographics?.employment_type;
      case 1: return !!data.demographics?.age && !!data.demographics?.city_type;
      case 2: return !!(data.income?.base_salary && data.income.base_salary > 0);
      case 3: return true; // HRA/rent optional
      case 4: return true; // investments optional
      case 5: return true; // review step — always can complete
      default: return false;
    }
  };

  return {
    step: state.step,
    data: state.data,
    isComplete: state.isComplete,
    isFirstStep: state.step === 0,
    isLastStep: state.step === (TOTAL_STEPS - 1),
    progress: Math.round((state.step / (TOTAL_STEPS - 1)) * 100),
    canProceed: canProceed(state.step, state.data),
    setDemographics,
    setIncome,
    setExpenses,
    setAssets,
    next,
    prev,
    complete,
    reset,
  };
}
