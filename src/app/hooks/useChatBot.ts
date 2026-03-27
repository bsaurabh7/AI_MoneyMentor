import { useState, useRef, useCallback, useEffect } from 'react';
import { calculateTax, calculateFIRE, type TaxResponse, type FireResponse } from '../utils/finCalc';
import type { CollectedData } from './useCollectedData';
import {
  getSalary, getHRA, getRent, getCityType, get80C, get80D, getNPS, getCurrentAge, getTotalMonthlyExpense
} from './useCollectedData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Re-export CollectedData for backwards compat with ChatScreen/SummaryPanel
export type { CollectedData };

// ── Types ──────────────────────────────────────────────────────────────────
export type ChatMessage =
  | { id: string; role: 'bot'; type: 'text'; content: string }
  | { id: string; role: 'user'; content: string }
  | { id: string; role: 'bot'; type: 'typing' }
  | { id: string; role: 'bot'; type: 'tax_result'; data: TaxResponse }
  | { id: string; role: 'bot'; type: 'fire_result'; data: FireResponse; retireAge: number };

type ConversationStep =
  // ── Phase 1 (skipped when wizard data is provided) ──
  | 'salary' | 'rent' | 'hra' | 'deduction80c' | 'nps'
  // ── Transition ──
  | 'tax_computing' | 'ask_fire'
  // ── FIRE ──
  | 'fire_age' | 'fire_retire_age_only' | 'fire_expenses' | 'fire_savings' | 'fire_computing'
  // ── Phase 2: deeper profiling ──
  | 'p2_secondary_income' | 'p2_passive_income' | 'p2_expenses_detail'
  | 'p2_insurance' | 'p2_home_loan' | 'p2_home_loan_interest' | 'p2_credit_card'
  | 'p2_emergency_fund' | 'p2_investments'
  // ── End ──
  | 'done';

// ── Parsers ────────────────────────────────────────────────────────────────
function parseAmount(text: string): number | null {
  const clean = text.replace(/[₹,\s]/g, '').toLowerCase();
  const crore = clean.match(/(\d+\.?\d*)\s*(?:cr(?:ore)?)/);
  if (crore) return parseFloat(crore[1]) * 10_000_000;
  const lakh = clean.match(/(\d+\.?\d*)\s*(?:lakh|l(?!\w))/);
  if (lakh) return parseFloat(lakh[1]) * 1_00_000;
  const k = clean.match(/(\d+\.?\d*)k(?!\w)/);
  if (k) return parseFloat(k[1]) * 1000;
  const num = clean.match(/(\d{4,}\.?\d*)/);
  if (num) return parseFloat(num[1]);
  const small = clean.match(/^(\d{1,3})$/);
  if (small) return parseFloat(small[1]);
  return null;
}

function detectCity(text: string): 'metro' | 'non-metro' | null {
  const lower = text.toLowerCase();
  const metros = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune'];
  if (metros.some((m) => lower.includes(m))) return 'metro';
  if (lower.includes('metro')) return 'metro';
  if (/non.metro|tier.?[23]|small city/.test(lower)) return 'non-metro';
  return null;
}

function parseYesNo(text: string): boolean | null {
  const lower = text.toLowerCase();
  if (/\b(yes|yeah|yep|y\b|sure|definitely|maxed|max|haan|ha)\b/.test(lower)) return true;
  if (/\b(no|nope|nah|n\b|none|nothing|nahi|nai)\b/.test(lower)) return false;
  return null;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtAmt(n: number): string {
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

// ── Quick replies per step ─────────────────────────────────────────────────
const QUICK_REPLIES: Record<ConversationStep, string[]> = {
  salary: ['₹12L', '₹18L', '₹24L', '₹36L'],
  rent: ['Yes, Metro city', 'Yes, Non-metro', "No, I own my home"],
  hra: ['₹3.6L per year', '₹2L per year', 'Not sure'],
  deduction80c: ['₹1.5L — maxed out', '₹1L', '₹50K', 'None'],
  nps: ['₹50,000', '₹25,000', 'No NPS'],
  tax_computing: [],
  ask_fire: ['Yes, plan my retirement 🔥', 'Show detailed breakdown', 'Start over'],
  fire_age: ['30 yrs, retire at 50', '28 yrs, retire at 45', '35 yrs, retire at 55'],
  fire_retire_age_only: [],
  fire_expenses: ['₹50K/month', '₹80K/month', '₹1.2L/month'],
  fire_savings: ['₹15L', '₹50L', 'Nothing yet'],
  fire_computing: [],
  // Phase 2
  p2_secondary_income: ['Yes, ₹20K/month', 'Yes, ₹50K/month', 'No secondary income'],
  p2_passive_income: ['Rental income', 'FD/dividend interest', 'None'],
  p2_expenses_detail: ['~₹30K/month', '~₹50K/month', '~₹80K/month'],
  p2_insurance: ['Health + Term both', 'Health only ₹15K', 'No insurance'],
  p2_home_loan: ['Yes, ₹40K EMI', 'Yes, ₹70K EMI', 'No home loan'],
  p2_home_loan_interest: ['~₹30K interest', '~₹50K interest', 'Not sure'],
  p2_credit_card: ['Yes, ~₹50K outstanding', 'Yes, ~₹2L outstanding', 'No credit card debt'],
  p2_emergency_fund: ['3-6 months covered', 'Less than 3 months', 'Not built yet'],
  p2_investments: ['Mostly MF/SIP', 'Mix of stocks + MF', 'Only EPF/FD'],
  done: ['What if I retire at 55?', 'Show fund suggestions', 'Start over'],
};

// ── Hook ──────────────────────────────────────────────────────────────────
export function useChatBot(initialData?: CollectedData) {
  const { user } = useAuth();
  const hasWizardData = !!initialData?.income?.base_salary;

  // Opening message depends on whether wizard gave us data
  const openingMsg = hasWizardData
    ? `Great! I've got your profile details 👋\n\nRunning your **Tax Analysis** now — calculating Old Regime vs New Regime for your ₹${((initialData!.income!.base_salary ?? 0) / 100_000).toFixed(1)}L salary... 🧮`
    : "Hi! I'm FinPilot 👋 I'll help you optimize your taxes and plan your FIRE retirement through a quick chat.\n\nWhat's your **annual salary (CTC)**? (e.g. \"18 lakhs\" or \"18L\")";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: 'bot', type: 'text', content: openingMsg },
  ]);

  const [step, setStep] = useState<ConversationStep>(hasWizardData ? 'tax_computing' : 'salary');
  const [collected, setCollected] = useState<CollectedData>(initialData ?? {});
  const [taxResult, setTaxResult] = useState<TaxResponse | null>(null);
  const [fireResult, setFireResult] = useState<FireResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingIdRef = useRef<string | null>(null);

  // If wizard provided data, auto-trigger tax computation on mount
  const hasTriggeredRef = useRef(false);

  const addBotMessage = useCallback((content: string, delay = 900) => {
    const typingId = uid();
    typingIdRef.current = typingId;
    setIsTyping(true);
    setMessages((prev) => [...prev, { id: typingId, role: 'bot', type: 'typing' }]);
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        setMessages((prev) =>
          prev.filter((m) => m.id !== typingId).concat({ id: uid(), role: 'bot', type: 'text', content })
        );
        setIsTyping(false);
        resolve();
      }, delay)
    );
  }, []);

  const addResultCard = useCallback(
    <T extends 'tax_result' | 'fire_result'>(
      type: T,
      data: T extends 'tax_result' ? TaxResponse : FireResponse,
      retireAge?: number,
      delay = 1200
    ) => {
      const typingId = uid();
      setIsTyping(true);
      setMessages((prev) => [...prev, { id: typingId, role: 'bot', type: 'typing' }]);
      return new Promise<void>((resolve) =>
        setTimeout(() => {
          setMessages((prev) =>
            prev.filter((m) => m.id !== typingId).concat(
              type === 'tax_result'
                ? { id: uid(), role: 'bot', type: 'tax_result', data: data as TaxResponse }
                : { id: uid(), role: 'bot', type: 'fire_result', data: data as FireResponse, retireAge: retireAge! }
            )
          );
          setIsTyping(false);
          resolve();
        }, delay)
      );
    },
    []
  );

  // ── Tax runner (shared by wizard path + chat path) ─────────────────────
  const runTaxAndAskFire = useCallback(
    async (data: CollectedData) => {
      const taxInputs = {
        salary: getSalary(data),
        hra_received: getHRA(data),
        rent_paid: getRent(data),
        city_type: getCityType(data),
        deduction_80c: get80C(data),
        deduction_80d: get80D(data),
        nps_80ccd: getNPS(data),
      };
      const result = calculateTax(taxInputs);
      setTaxResult(result);
      await addResultCard('tax_result', result, undefined, 800);

      if (user) {
        // Persist tax calculations & initial profile data
        const taxPromise = supabase.from('tax_calculations').upsert({
          user_id: user.id,
          financial_year: '2024-25',
          salary: taxInputs.salary,
          hra_received: taxInputs.hra_received,
          rent_paid: taxInputs.rent_paid,
          deduction_80c: taxInputs.deduction_80c,
          deduction_80d: taxInputs.deduction_80d,
          nps_80ccd: taxInputs.nps_80ccd,
          old_regime_tax: result.old_regime.total_tax,
          new_regime_tax: result.new_regime.total_tax,
          recommended_regime: result.winner === 'new' ? 'new' : 'old',
          savings_amount: result.savings,
          ai_reasoning: result.reasoning,
        }, { onConflict: 'user_id, financial_year' }).then(({ error }) => { if (error) console.error('Tax upsert error:', error); });

        const profilePromise = supabase.from('user_profiles').upsert({
          user_id: user.id,
          annual_income: taxInputs.salary,
          hra_received: taxInputs.hra_received,
          rent_paid_monthly: taxInputs.rent_paid,
          city_type: taxInputs.city_type,
          deduction_80c: taxInputs.deduction_80c,
          nps_80ccd: taxInputs.nps_80ccd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' }).then(({ error }) => { if (error) console.error('Profile upsert start error:', error); });
        
        // Fire & forget
        Promise.all([taxPromise, profilePromise]);
      }

      setTimeout(async () => {
        setStep('ask_fire');
        const age = data.demographics?.age;
        await addBotMessage(
          `Want me to also plan your **FIRE retirement**? 🎯\n\n${age ? `I see you are ${age} years old. When do you want to retire?` : `Just tell me your age and when you want to retire — I'll build a full corpus and SIP plan!`}`,
          700
        );
      }, 400);
    },
    [addBotMessage, addResultCard, user]
  );

  // React to wizard data being provided after mount
  useEffect(() => {
    if (initialData?.income?.base_salary && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setCollected(initialData);
      setStep('tax_computing');
      const salary = initialData.income.base_salary;
      setMessages([{ 
        id: uid(), 
        role: 'bot', 
        type: 'text', 
        content: `Great! I've got your profile details 👋\n\nRunning your **Tax Analysis** now — calculating Old Regime vs New Regime for your ₹${(salary / 100_000).toFixed(1)}L salary... 🧮` 
      }]);
      // Small delay for visual effect
      setTimeout(() => runTaxAndAskFire(initialData), 1200);
    }
  }, [initialData, runTaxAndAskFire]);

  const processStep = useCallback(
    async (userText: string, currentStep: ConversationStep, currentCollected: CollectedData) => {
      let nextStep = currentStep;
      let newData = { ...currentCollected };

      switch (currentStep) {

        // ── PHASE 1: Chat-collected fields (used when no wizard) ───────────
        case 'salary': {
          const amount = parseAmount(userText);
          if (amount && amount > 1000) {
            newData = { ...newData, income: { ...newData.income, base_salary: amount } };
            setCollected(newData);
            nextStep = 'rent';
            await addBotMessage(
              `Got it ✓ ${fmtAmt(amount)} salary noted!\n\nDo you live in a metro city (Mumbai, Delhi, Bengaluru…) and pay rent? If yes, how much per month?`
            );
          } else {
            await addBotMessage("I didn't quite catch that. Could you share your annual salary? e.g. \"18 lakhs\" or \"₹18L\".");
          }
          break;
        }

        case 'rent': {
          const city = detectCity(userText);
          const yesNo = parseYesNo(userText);
          const rentAmt = parseAmount(userText);
          if (yesNo === false || userText.toLowerCase().includes("own") || userText.toLowerCase().includes('no rent')) {
            newData = { ...newData, demographics: { ...newData.demographics, city_type: 'non-metro' }, expenses: { ...newData.expenses, rent_paid_monthly: 0 }, income: { ...newData.income, hra_received: 0 } };
            setCollected(newData);
            nextStep = 'deduction80c';
            await addBotMessage("No worries! HRA exemption skipped.\n\nHave you made any **80C investments**? (PPF, ELSS, LIC, EPF etc.) What's the total? Max is ₹1.5L.");
          } else {
            if (city) newData = { ...newData, demographics: { ...newData.demographics, city_type: city } };
            if (rentAmt && rentAmt > 100) newData = { ...newData, expenses: { ...newData.expenses, rent_paid_monthly: rentAmt } };
            setCollected(newData);
            nextStep = 'hra';
            await addBotMessage(
              `${city ? `${city === 'metro' ? 'Metro' : 'Non-metro'} noted ✓` : 'Got it ✓'}\n\nWhat's your **HRA component** in your salary slip? (Usually a separate line item — e.g. \"3.6 lakhs per year\")`
            );
          }
          break;
        }

        case 'hra': {
          const amount = parseAmount(userText);
          newData = { ...newData, income: { ...newData.income, hra_received: amount ?? 0 } };
          setCollected(newData);
          nextStep = 'deduction80c';
          await addBotMessage(
            amount
              ? `HRA ${fmtAmt(amount)} noted ✓\n\nHave you made any **80C investments**? (PPF, ELSS, LIC, EPF etc.) Max deduction is ₹1.5L.`
              : `No HRA noted. Moving on!\n\nHave you made any **80C investments**? (PPF, ELSS, LIC, EPF etc.) Max is ₹1.5L.`
          );
          break;
        }

        case 'deduction80c': {
          const yesNo = parseYesNo(userText);
          const amount = parseAmount(userText);
          const isMaxed = /maxed|max|full|1\.5|150000/.test(userText.toLowerCase());
          const finalAmt = yesNo === false || userText.toLowerCase() === 'none' ? 0 : isMaxed ? 150000 : amount ? Math.min(amount, 150000) : 150000;
          newData = { ...newData, assets: { ...newData.assets, deduction_80c: finalAmt } };
          setCollected(newData);
          nextStep = 'nps';
          await addBotMessage(
            finalAmt === 0
              ? "Okay, no 80C deductions noted.\n\nAny **NPS contribution** (Section 80CCD 1B)? This gives an extra ₹50K deduction!"
              : `Nice! ${fmtAmt(finalAmt)} in 80C investments ✓\n\nAny **NPS contribution** (80CCD 1B)? Extra ₹50K deduction!`
          );
          break;
        }

        case 'nps': {
          const yesNo = parseYesNo(userText);
          const amount = parseAmount(userText);
          const npsAmt = yesNo === false || /no nps/.test(userText.toLowerCase()) ? 0 : amount ? Math.min(amount, 50000) : 50000;
          newData = { ...newData, assets: { ...newData.assets, nps_80ccd: npsAmt, deduction_80d: 25000 } };
          setCollected(newData);
          nextStep = 'tax_computing';
          await addBotMessage('Got all your tax data! Calculating now... 🧮', 600);
          setTimeout(() => runTaxAndAskFire(newData), 300);
          break;
        }

        case 'tax_computing': {
          // handled by auto-trigger
          break;
        }

        // ── FIRE Flow ──────────────────────────────────────────────────────
        case 'ask_fire': {
          const lower = userText.toLowerCase();
          if (/start over|restart|reset/.test(lower)) { window.location.reload(); return; }
          
          if (parseYesNo(userText) === false || lower.includes('no') || lower.includes('skip') || lower.includes('nah')) {
            nextStep = 'p2_secondary_income';
            await addBotMessage("No problem! Let's skip retirement planning for now.\n\nNow let me build your **Money Health Score**. Quick follow-ups:\n\nDo you have any **secondary income**? (Freelance, side hustles, part-time)", 400);
            break;
          }

          const hasAge = !!newData.demographics?.age;
          if (hasAge) {
             nextStep = 'fire_retire_age_only';
             await addBotMessage(`Since you are ${newData.demographics!.age} years old, at what age do you want to retire?`);
          } else {
             nextStep = 'fire_age';
             await addBotMessage("Let's plan your retirement 🔥\n\nHow **old are you** and at what age do you want to **retire**? (e.g. \"I'm 34, want to retire at 50\")");
          }
          break;
        }

        case 'fire_retire_age_only': {
           const nums = userText.match(/\d+/g)?.map(Number) ?? [];
           const retireAge = nums.length > 0 ? nums[0] : 0;
           if (newData.demographics?.age && retireAge > newData.demographics.age) {
             newData = { ...newData, demographics: { ...newData.demographics, target_retirement_age: retireAge } };
             setCollected(newData);
             nextStep = 'fire_expenses';
             await addBotMessage(`Retiring at ${retireAge} ✓\n\nWhat are your **total monthly expenses** roughly? (Include rent, EMIs, groceries, utilities)`);
           } else {
             await addBotMessage("Could you share your target retirement age? It should be higher than your current age!");
           }
           break;
        }

        case 'fire_age': {
          const nums = userText.match(/\d+/g)?.map(Number) ?? [];
          let age = 0, retireAge = 0;
          if (nums.length >= 2) { age = nums[0]; retireAge = nums[1]; }
          else if (nums.length === 1) { age = nums[0]; retireAge = 50; }
          if (age >= 18 && retireAge > age) {
            newData = { ...newData, demographics: { ...newData.demographics, age, target_retirement_age: retireAge } };
            setCollected(newData);
            nextStep = 'fire_expenses';
            await addBotMessage(`Age ${age}, retiring at ${retireAge} ✓\n\nWhat are your **total monthly expenses** roughly? (Include rent, EMIs, groceries, utilities)`);
          } else {
            await addBotMessage("Could you share your current age and target retirement age? e.g. \"I'm 34, want to retire at 50\"");
          }
          break;
        }

        case 'fire_expenses': {
          const amount = parseAmount(userText);
          if (amount && amount > 100) {
            newData = { ...newData, expenses: { ...newData.expenses, fixed_monthly: amount } };
            setCollected(newData);
            nextStep = 'fire_savings';
            await addBotMessage(
              `${fmtAmt(amount)}/month expenses noted ✓\n\nAny **current savings or investments**? (e.g. \"15 lakhs\", \"50 lakhs\", or \"nothing yet\")`
            );
          } else {
            await addBotMessage("How much do you spend monthly? e.g. \"₹80,000/month\" or \"80K per month\"");
          }
          break;
        }

        case 'fire_savings': {
          const amount = parseAmount(userText);
          const isNone = /nothing|zero|none|no|nil|nahi/.test(userText.toLowerCase());
          const savings = isNone ? 0 : (amount || 0);
          newData = { ...newData, assets: { ...newData.assets, current_savings: savings } }; // Update newData with savings
          setCollected(newData);
          nextStep = 'fire_computing';

          await addBotMessage('Building your FIRE plan... 🔥', 600);
          setTimeout(async () => {
            const age = getCurrentAge(newData);
            const fireInputs = {
              current_age: age,
              retire_age: newData.demographics?.target_retirement_age || (newData.demographics?.age ? age + 20 : 50),
              annual_income: getSalary(newData),
              monthly_expense: getTotalMonthlyExpense(newData) || (newData.expenses?.fixed_monthly ?? 60000),
              current_savings: savings,
              expected_return: 12,
            };
            const result = calculateFIRE(fireInputs);
            setFireResult(result);
            await addResultCard('fire_result', result, fireInputs.retire_age, 900);

            if (user) {
              supabase.from('fire_plans').upsert({
                user_id: user.id,
                current_age: fireInputs.current_age,
                retire_age: fireInputs.retire_age,
                corpus_needed: result.corpus_needed,
                sip_per_month: result.sip_per_month,
                feasibility: result.feasibility === 'on track' ? 'on track' : result.feasibility === 'stretch goal' ? 'stretch goal' : 'needs revision',
                ai_reasoning: result.reasoning,
              }, { onConflict: 'user_id' }).then(({ error: e }) => { if (e) console.error('FIRE upsert err:', e); });

              // Also update profile with age, expenses, savings
              supabase.from('user_profiles').upsert({
                user_id: user.id,
                date_of_birth: newData.demographics?.age ? new Date(new Date().getFullYear() - newData.demographics.age, 0, 1).toISOString().split('T')[0] : null,
                monthly_expense: fireInputs.monthly_expense,
                current_savings: fireInputs.current_savings,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' }).then(({ error: e }) => { if (e) console.error('Profile upsert (fire) err:', e); });
            }

            setTimeout(async () => {
              setStep('p2_secondary_income');
              const f = result.feasibility;
              await addBotMessage(
                `Your plan is ${f === 'on track' ? 'on track — great work! 🎉' : f === 'stretch goal' ? 'ambitious but doable 💪' : 'challenging, but let\'s fix it ⚡'}\n\nNow let me build your **Money Health Score**. Quick follow-ups:\n\nDo you have any **secondary income**? (Freelance, side hustles, part-time)`,
                800
              );
            }, 400);
          }, 300);
          break;
        }

        case 'fire_computing': break;

        // ── PHASE 2: Money Health Score deeper profiling ───────────────────
        case 'p2_secondary_income': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          if (amount) newData = { ...newData, income: { ...newData.income, secondary_income_monthly: amount } };
          else if (yesNo === false || /no secondary|none/.test(userText.toLowerCase())) {
            newData = { ...newData, income: { ...newData.income, secondary_income_monthly: 0 } };
          }
          setCollected(newData);
          nextStep = 'p2_passive_income';
          await addBotMessage(
            `Noted ✓\n\nAny **passive income**? (Rental income, dividends, interest from FDs/savings)`
          );
          break;
        }

        case 'p2_passive_income': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          if (amount) newData = { ...newData, income: { ...newData.income, passive_income_monthly: amount } };
          else if (yesNo === false || /none|no/.test(userText.toLowerCase())) {
            newData = { ...newData, income: { ...newData.income, passive_income_monthly: 0 } };
          }
          setCollected(newData);
          nextStep = 'p2_insurance';
          await addBotMessage(
            `Got it ✓\n\nDo you have **health or life insurance**? Annual premium helps with 80D deduction (saves up to ₹7,800 tax!)`
          );
          break;
        }

        case 'p2_insurance': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          let healthPremium = amount ?? 0;
          if (yesNo === false || /no insurance|none/.test(userText.toLowerCase())) healthPremium = 0;
          newData = {
            ...newData,
            expenses: { ...newData.expenses, health_insurance_premium: healthPremium },
            assets: { ...newData.assets, deduction_80d: Math.min(healthPremium, 25000) || 25000 },
          };
          setCollected(newData);
          nextStep = 'p2_home_loan';
          await addBotMessage(
            `${healthPremium > 0 ? `₹${healthPremium.toLocaleString('en-IN')} premium noted ✓ — that's a ₹${Math.min(healthPremium, 25000).toLocaleString('en-IN')} deduction!\n\n` : 'Noted!\n\n'}Do you have a **home loan**? If yes, what's the monthly EMI?`
          );
          break;
        }

        case 'p2_home_loan': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          if (amount && amount > 0) {
            newData = { ...newData, liabilities: { ...newData.liabilities, home_loan_emi: amount } };
            setCollected(newData);
            nextStep = 'p2_home_loan_interest';
            await addBotMessage(
              `Home loan EMI ${fmtAmt(amount)}/month ✓\n\n💡 How much of that EMI goes towards **interest** (per year)? This is crucial — interest up to ₹2L qualifies for Section 24b tax deduction!`
            );
          } else if (yesNo === false || /no home loan|no loan/.test(userText.toLowerCase())) {
            newData = { ...newData, liabilities: { ...newData.liabilities, home_loan_emi: 0 } };
            setCollected(newData);
            nextStep = 'p2_credit_card';
            await addBotMessage("No home loan ✓\n\nDo you have any **credit card outstanding balance** or personal loans?");
          } else {
            await addBotMessage("Do you have a home loan? If yes, tell me the monthly EMI amount.");
          }
          break;
        }

        case 'p2_home_loan_interest': {
          const amount = parseAmount(userText);
          newData = { ...newData, liabilities: { ...newData.liabilities, home_loan_interest_annual: amount ?? 0 } };
          setCollected(newData);
          nextStep = 'p2_credit_card';
          await addBotMessage(
            amount
              ? `₹${amount.toLocaleString('en-IN')} annual interest noted ✓ — that saves you up to ₹${Math.min(amount, 200_000).toLocaleString('en-IN')} under Section 24b!\n\nDo you have any **credit card outstanding** or personal loans?`
              : "Noted! Do you have any **credit card outstanding balance** or personal loans?"
          );
          break;
        }

        case 'p2_credit_card': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          if (amount && amount > 0) {
            newData = { ...newData, liabilities: { ...newData.liabilities, credit_card_debt: amount } };
          } else if (yesNo === false || /no credit|no debt|none/.test(userText.toLowerCase())) {
            newData = { ...newData, liabilities: { ...newData.liabilities, credit_card_debt: 0 } };
          }
          setCollected(newData);
          nextStep = 'p2_emergency_fund';
          await addBotMessage(
            `Noted ✓\n\nLast one! How's your **emergency fund**? Ideally 6 months of expenses (~${fmtAmt((getTotalMonthlyExpense(newData) || 50_000) * 6)}).`
          );
          break;
        }

        case 'p2_emergency_fund': {
          const amount = parseAmount(userText);
          const months = /3.6|three|six|covered|good/.test(userText.toLowerCase());
          const low = /less|2|1|nothing|not built/.test(userText.toLowerCase());
          const efAmt = amount ?? (months ? (getTotalMonthlyExpense(newData) || 50_000) * 6 : low ? (getTotalMonthlyExpense(newData) || 50_000) * 2 : 0);
          newData = { ...newData, assets: { ...newData.assets, emergency_fund: efAmt } };
          setCollected(newData);
          nextStep = 'done';
          setStep('done');

          if (user) {
            // Final profile sync
            supabase.from('user_profiles').upsert({
              user_id: user.id,
              annual_income: getSalary(newData),
              hra_received: getHRA(newData),
              secondary_income_monthly: newData.income?.secondary_income_monthly ?? 0,
              passive_income_monthly: newData.income?.passive_income_monthly ?? 0,
              monthly_expense: getTotalMonthlyExpense(newData),
              rent_paid_monthly: getRent(newData),
              health_insurance_premium: newData.expenses?.health_insurance_premium ?? 0,
              current_savings: newData.assets?.current_savings ?? 0, // Use current_savings from assets
              emergency_fund: newData.assets?.emergency_fund ?? 0,
              deduction_80c: get80C(newData),
              deduction_80d: get80D(newData),
              nps_80ccd: getNPS(newData),
              home_loan_emi: newData.liabilities?.home_loan_emi ?? 0,
              home_loan_interest_annual: newData.liabilities?.home_loan_interest_annual ?? 0,
              credit_card_debt: newData.liabilities?.credit_card_debt ?? 0,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' }).then(({ error: e }) => { if (e) console.error('Final profile upsert err:', e); });
          }

          await addBotMessage(
            `🎯 **Money Health Score complete!**\n\nI now have a full financial picture. Check your **Money Health Score** and **Portfolio X-Ray** in the sidebar — they'll reflect your complete profile.\n\n*Not financial advice — consult a SEBI-registered advisor.*`,
            800
          );
          break;
        }

        case 'done': {
          const lower = userText.toLowerCase();
          if (/start over|restart|reset/.test(lower)) { window.location.reload(); return; }
          if (/retire at (\d+)|what if/.test(lower)) {
            const match = lower.match(/(\d+)/);
            const newRetire = match ? parseInt(match[1]) : (collected.demographics?.age ?? 30) + 20;
            if (newRetire > (collected.demographics?.age ?? 25)) {
              const result = calculateFIRE({
                current_age: getCurrentAge(newData),
                retire_age: newRetire,
                annual_income: getSalary(newData),
                monthly_expense: getTotalMonthlyExpense(newData) || 60000,
                current_savings: newData.assets?.emergency_fund ?? 0,
                expected_return: 12,
              });
              await addBotMessage(`Here's the update for retiring at age ${newRetire}:`, 500);
              await addResultCard('fire_result', result, newRetire, 700);
            } else {
              await addBotMessage("Please enter a retirement age higher than your current age!");
            }
          } else {
            await addBotMessage(
              "I've shared your complete Tax and FIRE analysis above! 📊\n\nUse the **sidebar tools** for deeper dives — Tax Optimizer, FIRE Planner, Money Health Score, or Portfolio X-Ray. Or say **\"start over\"** to begin fresh!"
            );
          }
          break;
        }
      }

      if (nextStep !== currentStep) setStep(nextStep);
    },
    [addBotMessage, addResultCard, collected, runTaxAndAskFire, user]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;
      const userMsg: ChatMessage = { id: uid(), role: 'user', content: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      await processStep(text.trim(), step, collected);
    },
    [isTyping, step, collected, processStep]
  );

  // ── Progress ───────────────────────────────────────────────────────────
  const progress = (() => {
    let score = 0;
    const d = collected;
    if (d.income?.base_salary) score += 15;
    if (d.demographics?.city_type) score += 5;
    if (d.income?.hra_received !== undefined) score += 5;
    if (d.expenses?.rent_paid_monthly !== undefined) score += 5;
    if (d.assets?.deduction_80c !== undefined) score += 10;
    if (d.assets?.nps_80ccd !== undefined) score += 5;
    if (d.demographics?.age) score += 5;
    if (d.demographics?.employment_type) score += 5;
    if (d.demographics?.marital_status) score += 5;
    if (d.income?.secondary_income_monthly !== undefined) score += 5;
    if (d.income?.passive_income_monthly !== undefined) score += 5;
    if (d.expenses?.health_insurance_premium !== undefined) score += 10;
    if (d.liabilities?.home_loan_emi !== undefined) score += 5;
    if (d.liabilities?.credit_card_debt !== undefined) score += 5;
    if (d.assets?.emergency_fund !== undefined) score += 10;
    return Math.min(score, 100);
  })();

  return {
    messages,
    sendMessage,
    isTyping,
    step,
    collected,
    taxResult,
    fireResult,
    progress,
    quickReplies: QUICK_REPLIES[step] ?? [],
  };
}