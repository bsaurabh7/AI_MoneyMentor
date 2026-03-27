import { useState, useRef, useCallback, useEffect } from 'react';
import { calculateTax, calculateFIRE, type TaxResponse, type FireResponse } from '../utils/finCalc';
import type { CollectedData, PortfolioFund } from './useCollectedData';
import {
  getSalary, getHRA, getRent, getCityType, get80C, get80D, getNPS,
  getCurrentAge, getTotalMonthlyExpense, getExpectedReturn
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
  | 'salary' | 'rent' | 'hra' | 'deduction80c' | 'nps' | 'deduction80d'
  // ── Transition ──
  | 'tax_computing' | 'ask_fire'
  // ── Block C: FIRE ──
  | 'fire_age' | 'fire_retire_age_only' | 'fire_expenses' | 'fire_discretionary'
  | 'fire_savings' | 'fire_expected_return' | 'fire_computing'
  // ── Block D: Money Health ──
  | 'p2_secondary_income' | 'p2_epf' | 'p2_passive_income'
  | 'p2_term_insurance' | 'p2_insurance' | 'p2_home_loan' | 'p2_home_loan_interest'
  | 'p2_credit_card' | 'p2_emergency_months' | 'p2_sip' | 'p2_total_investments'
  | 'p2_tax_regime'
  // ── Block E: Portfolio X-Ray ──
  | 'portfolio_intro' | 'portfolio_fund_name' | 'portfolio_fund_invested'
  | 'portfolio_fund_value' | 'portfolio_fund_category' | 'portfolio_confirm'
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

function parsePercent(text: string): number | null {
  const clean = text.toLowerCase().replace(/\s/g, '');
  const match = clean.match(/(\d+\.?\d*)%?/);
  if (!match) return null;
  const n = parseFloat(match[1]);
  if (n > 1 && n <= 25) return n / 100;        // e.g. "12" → 0.12
  if (n <= 1 && n > 0) return n;                // e.g. "0.12" → 0.12
  return null;
}

function detectCity(text: string): 'metro' | 'non-metro' | null {
  const lower = text.toLowerCase();
  const metros = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'chennai',
    'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'surat', 'jaipur', 'lucknow'];
  if (metros.some((m) => lower.includes(m))) return 'metro';
  if (lower.includes('metro')) return 'metro';
  if (/non.metro|tier.?[23]|small city/.test(lower)) return 'non-metro';
  return null;
}

function parseYesNo(text: string): boolean | null {
  const lower = text.toLowerCase();
  if (/\b(yes|yeah|yep|y\b|sure|definitely|maxed|max|haan|ha|have|i do)\b/.test(lower)) return true;
  if (/\b(no|nope|nah|n\b|none|nothing|nahi|nai|don't|dont)\b/.test(lower)) return false;
  return null;
}

function parseEmergencyMonths(text: string): '<1' | '1-3' | '3-6' | '>6' | null {
  const lower = text.toLowerCase();
  if (/less than 1|<\s*1|zero|nothing|0 month/.test(lower)) return '<1';
  if (/1[\s-]?3|one|two|three|1 month|2 month|3 month/.test(lower)) return '1-3';
  if (/3[\s-]?6|four|five|six|4 month|5 month|6 month|half year/.test(lower)) return '3-6';
  if (/6\+|more than 6|\bover 6\b|>6|year|years/.test(lower)) return '>6';
  return null;
}

type FundCategory = 'large_cap' | 'mid_cap' | 'small_cap' | 'flexi_cap' | 'elss' | 'debt' | 'international';
function parseFundCategory(text: string): FundCategory | null {
  const lower = text.toLowerCase();
  if (/large.cap|large cap/.test(lower)) return 'large_cap';
  if (/mid.cap|mid cap/.test(lower)) return 'mid_cap';
  if (/small.cap|small cap/.test(lower)) return 'small_cap';
  if (/flexi|flex/.test(lower)) return 'flexi_cap';
  if (/elss|tax saving/.test(lower)) return 'elss';
  if (/debt|bond|gilt|liquid/.test(lower)) return 'debt';
  if (/international|global|us|nasdaq/.test(lower)) return 'international';
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
  deduction80d: ['₹15,000', '₹25,000', 'No health insurance'],
  nps: ['₹50,000', '₹25,000', 'No NPS'],
  tax_computing: [],
  ask_fire: ['Yes, plan my retirement 🔥', 'Not right now'],
  fire_age: ['30 yrs, retire at 50', '28 yrs, retire at 45', '35 yrs, retire at 55'],
  fire_retire_age_only: ['50 years', '55 years', '60 years'],
  fire_expenses: ['₹50K/month', '₹80K/month', '₹1.2L/month'],
  fire_discretionary: ['₹10K/month', '₹20K/month', '₹30K/month', 'Negligible'],
  fire_savings: ['₹15L', '₹50L', '₹1Cr', 'Nothing yet'],
  fire_expected_return: ['12% (Market avg)', '10%', '8% (Conservative)', 'FD returns (~6.5%)'],
  fire_computing: [],
  // Block D
  p2_secondary_income: ['Yes, ₹20K/month', 'Yes, ₹50K/month', 'No secondary income'],
  p2_epf: ['₹5,000/month', '₹8,000/month', 'No EPF'],
  p2_passive_income: ['Rental income', 'FD/dividend interest', 'None'],
  p2_term_insurance: ['Yes, I have term insurance', 'No, I don\'t'],
  p2_insurance: ['₹10,000/year', '₹15,000/year', '₹25,000/year', 'No health insurance'],
  p2_home_loan: ['Yes, ₹40K EMI', 'Yes, ₹70K EMI', 'No home loan'],
  p2_home_loan_interest: ['~₹30K interest', '~₹50K interest', 'Not sure'],
  p2_credit_card: ['Yes, ~₹50K outstanding', 'Yes, ~₹2L outstanding', 'No credit card debt'],
  p2_emergency_months: ['< 1 month', '1–3 months', '3–6 months', '6+ months'],
  p2_sip: ['₹5,000/month', '₹10,000/month', '₹20,000/month', 'No SIP yet'],
  p2_total_investments: ['₹5L', '₹20L', '₹50L', '₹1Cr+'],
  p2_tax_regime: ['Yes, chose a regime', 'Not sure / haven\'t decided'],
  // Block E
  portfolio_intro: ['Yes, analyse my portfolio', 'Skip for now'],
  portfolio_fund_name: [],
  portfolio_fund_invested: [],
  portfolio_fund_value: [],
  portfolio_fund_category: ['Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS', 'Debt', 'International'],
  portfolio_confirm: ['Yes, looks right!', 'No, let me correct'],
  done: ['What if I retire at 55?', 'Start over'],
};

// ── Hook ──────────────────────────────────────────────────────────────────
export function useChatBot(initialData?: CollectedData) {
  const { user } = useAuth();
  const hasWizardData = !!initialData?.income?.base_salary;

  // Opening message depends on whether wizard gave us data
  const openingMsg = hasWizardData
    ? `Great! I've got your profile details 👋\n\nRunning your **Tax Analysis** now — calculating Old Regime vs New Regime for your ₹${((initialData!.income!.base_salary ?? 0) / 100_000).toFixed(1)}L salary... 🧮`
    : "Hi! I'm FinPilot 👋 I'll help you optimize your taxes, plan retirement, and build your Money Health Score.\n\nWhat's your **annual salary (CTC)**? (e.g. \"18 lakhs\" or \"18L\")";

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: 'bot', type: 'text', content: openingMsg },
  ]);

  const [step, setStep] = useState<ConversationStep>(hasWizardData ? 'tax_computing' : 'salary');
  const [collected, setCollected] = useState<CollectedData>(initialData ?? {});
  const [taxResult, setTaxResult] = useState<TaxResponse | null>(null);
  const [fireResult, setFireResult] = useState<FireResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Refs must be declared before use
  const hasTriggeredRef = useRef(false);
  const typingIdRef = useRef<string | null>(null);

  // Portfolio entry state (persisted across turns in the looping block E)
  const [pendingFund, setPendingFund] = useState<Partial<PortfolioFund>>({});
  const [fundCount, setFundCount] = useState(0);

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
        supabase.from('tax_calculations').upsert({
          user_id: user.id,
          financial_year: '2024-25',
          salary: taxInputs.salary,
          hra_received: taxInputs.hra_received,
          rent_paid: taxInputs.rent_paid,
          city_type: taxInputs.city_type,
          deduction_80c: taxInputs.deduction_80c,
          deduction_80d: taxInputs.deduction_80d,
          nps_80ccd: taxInputs.nps_80ccd,
          old_regime_tax: result.old_regime.total_tax,
          new_regime_tax: result.new_regime.total_tax,
          recommended_regime: result.winner === 'new' ? 'new' : 'old',
          savings_amount: result.savings,
          ai_reasoning: result.reasoning,
        }, { onConflict: 'user_id, financial_year' })
          .then(({ error }) => { if (error) console.error('Tax upsert error:', error); });

        supabase.from('user_profiles').upsert({
          user_id: user.id,
          annual_income: taxInputs.salary,
          hra_received: taxInputs.hra_received,
          rent_paid_monthly: data.expenses?.rent_paid_monthly ?? 0,
          city_type: taxInputs.city_type,
          deduction_80c: taxInputs.deduction_80c,
          deduction_80d: taxInputs.deduction_80d,
          nps_80ccd: taxInputs.nps_80ccd,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
          .then(({ error }) => { if (error) console.error('Profile upsert error:', error); });
      }

      setTimeout(async () => {
        setStep('ask_fire');
        const age = data.demographics?.age;
        await addBotMessage(
          `Want me to also plan your **FIRE retirement**? 🎯\n\n${age ? `I see you're ${age} years old. Would you like to plan your retirement?` : `Just say yes and I'll build a full corpus and SIP plan for you!`}`,
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
      setTimeout(() => runTaxAndAskFire(initialData), 1200);
    }
  }, [initialData, runTaxAndAskFire]);

  const processStep = useCallback(
    async (userText: string, currentStep: ConversationStep, currentCollected: CollectedData) => {
      let nextStep = currentStep;
      let newData = { ...currentCollected };

      switch (currentStep) {

        // ── PHASE 1: Chat-path fields ────────────────────────────────────────
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
              `${city ? `${city === 'metro' ? 'Metro' : 'Non-metro'} noted ✓` : 'Got it ✓'}\n\nWhat's your **HRA component** in your salary slip? (Separate line item, e.g. "3.6 lakhs per year")`
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
          nextStep = 'deduction80d';
          await addBotMessage(
            finalAmt === 0
              ? "Okay, no 80C deductions.\n\nDo you have **health insurance**? What's your annual premium? (This is your 80D deduction)"
              : `Nice! ${fmtAmt(finalAmt)} in 80C investments ✓\n\nDo you have **health insurance**? What's your annual premium? (80D deduction — max ₹25K)`
          );
          break;
        }

        case 'deduction80d': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          const premium = yesNo === false || /no insurance|no health|none/.test(userText.toLowerCase()) ? 0 : amount ?? 0;
          newData = {
            ...newData,
            expenses: { ...newData.expenses, health_insurance_premium: premium },
            assets: { ...newData.assets, deduction_80d: Math.min(premium, 25000), has_health_insurance: premium > 0 },
          };
          setCollected(newData);
          nextStep = 'nps';
          await addBotMessage(
            premium > 0
              ? `₹${premium.toLocaleString('en-IN')} health premium noted ✓ — that's ₹${Math.min(premium, 25000).toLocaleString('en-IN')} in 80D deduction!\n\nAny **NPS contribution** (Section 80CCD 1B)? Extra ₹50K deduction!`
              : `No health insurance noted.\n\nAny **NPS contribution** (80CCD 1B)? Extra ₹50K deduction!`
          );
          break;
        }

        case 'nps': {
          const yesNo = parseYesNo(userText);
          const amount = parseAmount(userText);
          const npsAmt = yesNo === false || /no nps/.test(userText.toLowerCase()) ? 0 : amount ? Math.min(amount, 50000) : 50000;
          newData = { ...newData, assets: { ...newData.assets, nps_80ccd: npsAmt } };
          setCollected(newData);
          nextStep = 'tax_computing';
          await addBotMessage('Got all your tax data! Calculating now... 🧮', 600);
          setTimeout(() => runTaxAndAskFire(newData), 300);
          break;
        }

        case 'tax_computing': break;

        // ── FIRE Flow ──────────────────────────────────────────────────────
        case 'ask_fire': {
          const lower = userText.toLowerCase();
          if (/start over|restart|reset/.test(lower)) { window.location.reload(); return; }

          if (parseYesNo(userText) === false || lower.includes('no') || lower.includes('skip') || lower.includes('nah') || lower.includes('not now')) {
            nextStep = 'p2_secondary_income';
            await addBotMessage("No problem!\n\nNow let me build your **Money Health Score**. Quick follow-ups:\n\nDo you have any **secondary income**? (Freelance, side hustles, part-time)", 400);
            break;
          }

          const hasAge = !!newData.demographics?.age;
          if (hasAge) {
            nextStep = 'fire_retire_age_only';
            await addBotMessage(`Since you're ${newData.demographics!.age}, at what age would you like to **retire**?`);
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
            await addBotMessage(`Retiring at ${retireAge} ✓\n\nWhat are your **total fixed monthly expenses**? (groceries, bills, school fees — not rent or EMIs)`);
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
            await addBotMessage(`Age ${age}, retiring at ${retireAge} ✓\n\nWhat are your **total fixed monthly expenses**? (groceries, bills, school fees — not rent or EMIs)`);
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
            nextStep = 'fire_discretionary';
            await addBotMessage(
              `${fmtAmt(amount)}/month fixed expenses noted ✓\n\nAnd **discretionary spending** — dining out, travel, subscriptions, entertainment? (monthly, rough estimate is fine)`
            );
          } else {
            await addBotMessage("How much do you spend monthly on essential expenses? e.g. \"₹80,000/month\" or \"80K per month\"");
          }
          break;
        }

        case 'fire_discretionary': {
          const amount = parseAmount(userText);
          const isNone = /nothing|zero|none|no|nil|negligible|skip/.test(userText.toLowerCase());
          const disc = isNone ? 0 : (amount || 0);
          newData = { ...newData, expenses: { ...newData.expenses, discretionary_monthly: disc } };
          setCollected(newData);
          nextStep = 'fire_savings';
          await addBotMessage(
            `Got it ✓\n\nAny **current savings or investments** already set aside? (All accounts, MFs, FDs — rough number is fine, e.g. "15 lakhs" or "nothing yet")`
          );
          break;
        }

        case 'fire_savings': {
          const amount = parseAmount(userText);
          const isNone = /nothing|zero|none|no|nil|nahi/.test(userText.toLowerCase());
          const savings = isNone ? 0 : (amount || 0);
          newData = { ...newData, assets: { ...newData.assets, current_savings: savings } };
          setCollected(newData);
          nextStep = 'fire_expected_return';
          await addBotMessage(
            `${savings > 0 ? `${fmtAmt(savings)} saved up ✓` : 'Starting from scratch — that\'s fine!'}\n\nWhat **annual return** do you expect on your investments?\n\n*(Most people use 10–12%. FD is around 6.5%. You can say "market average" for 12%.)*`
          );
          break;
        }

        case 'fire_expected_return': {
          const lower = userText.toLowerCase();
          let returnRate = 0.12;
          if (/fd|fixed deposit|conservative/.test(lower)) returnRate = 0.065;
          else if (/market|average|default/.test(lower)) returnRate = 0.12;
          else {
            const pct = parsePercent(userText);
            if (pct) returnRate = pct;
          }
          newData = { ...newData, assets: { ...newData.assets, expected_return: returnRate } };
          setCollected(newData);
          nextStep = 'fire_computing';

          await addBotMessage(`${(returnRate * 100).toFixed(1)}% expected return noted ✓\n\nBuilding your FIRE plan... 🔥`, 600);
          setTimeout(async () => {
            const age = getCurrentAge(newData);
            const retireAge = newData.demographics?.target_retirement_age || age + 20;
            const fireInputs = {
              current_age: age,
              retire_age: retireAge,
              annual_income: getSalary(newData),
              monthly_expense: getTotalMonthlyExpense(newData) || (newData.expenses?.fixed_monthly ?? 60000),
              current_savings: newData.assets?.current_savings ?? 0,
              expected_return: getExpectedReturn(newData),
            };
            const result = calculateFIRE(fireInputs);
            setFireResult(result);
            await addResultCard('fire_result', result, retireAge, 900);

            if (user) {
              supabase.from('fire_plans').upsert({
                user_id: user.id,
                current_age: fireInputs.current_age,
                retire_age: fireInputs.retire_age,
                corpus_needed: result.corpus_needed,
                sip_per_month: result.sip_per_month,
                feasibility: result.feasibility === 'on track' ? 'on track' : result.feasibility === 'stretch goal' ? 'stretch goal' : 'needs revision',
                annual_expense_at_retire: result.annual_expense_at_retire,
                expected_return: returnRate,
                chart_data: result.chart_data,
              }, { onConflict: 'user_id' })
                .then(({ error: e }) => { if (e) console.error('FIRE upsert err:', e); });

              supabase.from('user_profiles').upsert({
                user_id: user.id,
                date_of_birth: newData.demographics?.age ? new Date(new Date().getFullYear() - newData.demographics.age, 0, 1).toISOString().split('T')[0] : undefined,
                monthly_expense: fireInputs.monthly_expense,
                current_savings: fireInputs.current_savings,
                expected_return: returnRate,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id' })
                .then(({ error: e }) => { if (e) console.error('Profile upsert (fire) err:', e); });
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

        // ── BLOCK D: Money Health Score deeper profiling ───────────────────
        case 'p2_secondary_income': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          if (amount) newData = { ...newData, income: { ...newData.income, secondary_income_monthly: amount } };
          else if (yesNo === false || /no secondary|none/.test(userText.toLowerCase())) {
            newData = { ...newData, income: { ...newData.income, secondary_income_monthly: 0 } };
          }
          setCollected(newData);
          nextStep = 'p2_epf';
          await addBotMessage(`Noted ✓\n\nHow much goes to **EPF** from your salary every month? (If self-employed or none, say "no EPF")`);
          break;
        }

        case 'p2_epf': {
          const amount = parseAmount(userText);
          const yesNo = parseYesNo(userText);
          const epf = yesNo === false || /no epf|none|self.employed/.test(userText.toLowerCase()) ? 0 : amount ?? 0;
          newData = { ...newData, income: { ...newData.income, epf_monthly: epf } };
          setCollected(newData);
          nextStep = 'p2_passive_income';
          await addBotMessage(`Got it ✓\n\nAny **passive income**? (Rental income, dividends, interest from FDs/savings)`);
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
          nextStep = 'p2_term_insurance';
          await addBotMessage(`Got it ✓\n\nDo you have a **term life insurance** policy? (Yes/No)`);
          break;
        }

        case 'p2_term_insurance': {
          const yesNo = parseYesNo(userText);
          const hasTerm = yesNo !== false;
          newData = { ...newData, assets: { ...newData.assets, has_term_insurance: hasTerm } };
          setCollected(newData);
          nextStep = 'p2_insurance';
          await addBotMessage(
            `${hasTerm ? 'Term insurance ✓ — great protection!' : 'Okay, noted.'}\n\nDo you have **health insurance**? What's your annual premium? (Gives you 80D deduction)`
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
            assets: { ...newData.assets, deduction_80d: Math.min(healthPremium, 25000), has_health_insurance: healthPremium > 0 },
          };
          setCollected(newData);
          nextStep = 'p2_home_loan';
          await addBotMessage(
            `${healthPremium > 0 ? `₹${healthPremium.toLocaleString('en-IN')} premium noted ✓ — ₹${Math.min(healthPremium, 25000).toLocaleString('en-IN')} 80D deduction!\n\n` : 'No health insurance noted.\n\n'}Do you have a **home loan**? If yes, what's the monthly EMI?`
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
              `Home loan EMI ${fmtAmt(amount)}/month ✓\n\n💡 How much of that goes towards **interest per year**? (Interest up to ₹2L qualifies for Section 24b tax deduction!)`
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
              ? `₹${amount.toLocaleString('en-IN')} annual interest noted ✓ — saves you up to ₹${Math.min(amount, 200_000).toLocaleString('en-IN')} under Section 24b!\n\nDo you have any **credit card outstanding** or personal loans?`
              : "Noted! Do you have any **credit card outstanding** or personal loans?"
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
          nextStep = 'p2_emergency_months';
          await addBotMessage(
            `Noted ✓\n\n**Emergency fund check:** How many months of expenses could you cover if you lost income tomorrow?`,
          );
          break;
        }

        case 'p2_emergency_months': {
          const months = parseEmergencyMonths(userText);
          const rawAmount = parseAmount(userText);
          const totalExpense = getTotalMonthlyExpense(newData) || 50_000;
          // Also derive emergency_fund ₹ from months category
          const efAmt = rawAmount ?? (
            months === '<1' ? totalExpense * 0.5
              : months === '1-3' ? totalExpense * 2
              : months === '3-6' ? totalExpense * 5
              : months === '>6' ? totalExpense * 8
              : totalExpense * 3
          );
          newData = {
            ...newData,
            assets: {
              ...newData.assets,
              emergency_months: months ?? undefined,
              emergency_fund: efAmt
            }
          };
          setCollected(newData);
          nextStep = 'p2_sip';
          await addBotMessage(`Got it ✓\n\nHow much do you invest via **SIPs every month**? (Say "none" or "0" if you haven't started yet)`);
          break;
        }

        case 'p2_sip': {
          const amount = parseAmount(userText);
          const isNone = /none|zero|no|not yet|haven't/.test(userText.toLowerCase());
          const sip = isNone ? 0 : (amount ?? 0);
          newData = { ...newData, assets: { ...newData.assets, monthly_sip: sip } };
          setCollected(newData);
          nextStep = 'p2_total_investments';
          await addBotMessage(`${sip > 0 ? `${fmtAmt(sip)}/month SIP noted ✓` : 'SIP not started yet — good to plan one!'}\n\nWhat's the **total current value** of all your investments? (Mutual funds, stocks, FDs, gold — rough estimate)`);
          break;
        }

        case 'p2_total_investments': {
          const amount = parseAmount(userText);
          const isNone = /none|zero|no|nothing|nil/.test(userText.toLowerCase());
          const investments = isNone ? 0 : (amount ?? 0);
          newData = { ...newData, assets: { ...newData.assets, total_investments: investments } };
          setCollected(newData);
          nextStep = 'p2_tax_regime';
          await addBotMessage(`Got it ✓\n\nHave you actively **chosen your tax regime** for FY 2025-26? (Old or New Regime — even if auto-selected)`);
          break;
        }

        case 'p2_tax_regime': {
          const yesNo = parseYesNo(userText);
          const chosen = yesNo !== false && !/not sure|haven't/.test(userText.toLowerCase());
          newData = { ...newData, assets: { ...newData.assets, tax_regime_chosen: chosen } };
          setCollected(newData);
          nextStep = 'portfolio_intro';
          setStep('portfolio_intro');

          // Final Money Health profile sync
          if (user) {
            supabase.from('user_profiles').upsert({
              user_id: user.id,
              annual_income: getSalary(newData),
              hra_received: getHRA(newData),
              secondary_income_monthly: newData.income?.secondary_income_monthly ?? 0,
              passive_income_monthly: newData.income?.passive_income_monthly ?? 0,
              epf_monthly: newData.income?.epf_monthly ?? 0,
              monthly_expense: getTotalMonthlyExpense(newData),
              rent_paid_monthly: newData.expenses?.rent_paid_monthly ?? 0,
              health_insurance_premium: newData.expenses?.health_insurance_premium ?? 0,
              current_savings: newData.assets?.current_savings ?? 0,
              emergency_fund: newData.assets?.emergency_fund ?? 0,
              monthly_sip: newData.assets?.monthly_sip ?? 0,
              total_investments: newData.assets?.total_investments ?? 0,
              deduction_80c: get80C(newData),
              deduction_80d: get80D(newData),
              nps_80ccd: getNPS(newData),
              home_loan_emi: newData.liabilities?.home_loan_emi ?? 0,
              home_loan_interest_annual: newData.liabilities?.home_loan_interest_annual ?? 0,
              credit_card_debt: newData.liabilities?.credit_card_debt ?? 0,
              emergency_months: newData.assets?.emergency_months,
              has_term_insurance: newData.assets?.has_term_insurance ?? false,
              has_health_insurance: newData.assets?.has_health_insurance ?? false,
              tax_regime_chosen: chosen,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
              .then(({ error: e }) => { if (e) console.error('Final profile upsert err:', e); });
          }

          await addBotMessage(
            `✅ **Money Health data collected!**\n\nNow the last section — want me to analyse your **mutual fund portfolio**? I can check overlap, expense ratios, and suggest rebalancing.\n\n*(Say "skip" to go straight to your results.)*`,
            800
          );
          break;
        }

        // ── BLOCK E: Portfolio X-Ray ──────────────────────────────────────
        case 'portfolio_intro': {
          const lower = userText.toLowerCase();
          if (/skip|no|later|not now|done/.test(lower)) {
            nextStep = 'done';
            await addBotMessage(
              `No problem! Your **Tax, FIRE & Money Health data** is all saved. 📊\n\nCheck the sidebar for your full reports — Tax Optimizer, FIRE Planner, and Money Health Score all reflect your profile now.\n\n⚠️ *AI-generated analysis. Not licensed financial advice. Consult a SEBI-registered advisor.*`,
              600
            );
            break;
          }
          nextStep = 'portfolio_fund_name';
          setFundCount(0);
          setPendingFund({});
          await addBotMessage(`Let's analyse your portfolio! 📈\n\nAdd your mutual funds one at a time. I'll calculate overlap, expense drag, and suggest rebalancing.\n\n**Fund 1 — What's the name of the fund?**`);
          break;
        }

        case 'portfolio_fund_name': {
          if (/done|that'?s all|finish|no more/.test(userText.toLowerCase())) {
            // Confirm and save
            const funds = newData.portfolio ?? [];
            if (funds.length === 0) {
              await addBotMessage("You haven't added any funds yet! Tell me the name of your first fund, or say \"skip\" to skip portfolio analysis.");
              break;
            }
            nextStep = 'portfolio_confirm';
            const fundList = funds.map((f, i) => `${i + 1}. **${f.name}** — ₹${f.amount_invested.toLocaleString('en-IN')} invested, ₹${f.current_value.toLocaleString('en-IN')} now (${f.category.replace(/_/g, ' ')})`).join('\n');
            await addBotMessage(`Here's what I have:\n${fundList}\n\nLooks right? I'll analyse this now.`);
            break;
          }
          setPendingFund({ name: userText.trim() });
          nextStep = 'portfolio_fund_invested';
          await addBotMessage(`**${userText.trim()}** noted ✓\n\nHow much did you **invest in total** in this fund? (₹)`);
          break;
        }

        case 'portfolio_fund_invested': {
          const amount = parseAmount(userText);
          if (!amount) { await addBotMessage("How much did you invest in this fund? e.g. \"₹1 lakh\" or \"₹50,000\""); break; }
          setPendingFund((prev) => ({ ...prev, amount_invested: amount }));
          nextStep = 'portfolio_fund_value';
          await addBotMessage(`₹${amount.toLocaleString('en-IN')} invested ✓\n\nWhat's the **current value** of this fund today? (Check your app or Kite/Groww)`);
          break;
        }

        case 'portfolio_fund_value': {
          const amount = parseAmount(userText);
          if (!amount) { await addBotMessage("What's the current value? e.g. \"₹1.2 lakhs\""); break; }
          setPendingFund((prev) => ({ ...prev, current_value: amount }));
          nextStep = 'portfolio_fund_category';
          await addBotMessage(`₹${amount.toLocaleString('en-IN')} current value ✓\n\nWhat **category** is this fund?`);
          break;
        }

        case 'portfolio_fund_category': {
          const cat = parseFundCategory(userText);
          if (!cat) { await addBotMessage("Please pick a category: Large Cap, Mid Cap, Small Cap, Flexi Cap, ELSS, Debt, or International."); break; }

          const completedFund: PortfolioFund = {
            name: pendingFund.name ?? 'Fund',
            amount_invested: pendingFund.amount_invested ?? 0,
            current_value: pendingFund.current_value ?? 0,
            category: cat,
          };
          const updatedFunds = [...(newData.portfolio ?? []), completedFund];
          newData = { ...newData, portfolio: updatedFunds };
          setCollected(newData);
          const n = fundCount + 1;
          setFundCount(n);
          setPendingFund({});

          if (user) {
            const sessionId = new Date().toISOString().split('T')[0]; // date as session
            supabase.from('portfolio_funds').insert({
              user_id: user.id,
              session_id: sessionId,
              fund_name: completedFund.name,
              amount_invested: completedFund.amount_invested,
              current_value: completedFund.current_value,
              category: completedFund.category,
            }).then(({ error: e }) => { if (e) console.error('Portfolio fund insert err:', e); });
          }

          nextStep = 'portfolio_fund_name';
          await addBotMessage(`**${completedFund.name}** saved ✓\n\nAny more funds? Or type **"done"** to get your portfolio analysis.`);
          break;
        }

        case 'portfolio_confirm': {
          if (/no|correct|change/.test(userText.toLowerCase())) {
            nextStep = 'portfolio_fund_name';
            await addBotMessage("Sure! Which fund would you like to correct? Just tell me the name and I'll update it. Or start fresh with a new fund name.");
            break;
          }
          nextStep = 'done';
          const funds = newData.portfolio ?? [];
          const totalInvested = funds.reduce((sum, f) => sum + f.amount_invested, 0);
          const totalCurrent = funds.reduce((sum, f) => sum + f.current_value, 0);
          const gain = totalCurrent - totalInvested;
          const gainPct = totalInvested > 0 ? ((gain / totalInvested) * 100).toFixed(1) : '0';

          await addBotMessage(
            `🎉 **Portfolio Analysis Complete!**\n\n📊 **${funds.length} funds** added\n💰 Total invested: ₹${totalInvested.toLocaleString('en-IN')}\n📈 Current value: ₹${totalCurrent.toLocaleString('en-IN')}\n${gain >= 0 ? '✅' : '⚠️'} Overall gain: ${gain >= 0 ? '+' : ''}${gainPct}% (₹${Math.abs(gain).toLocaleString('en-IN')})\n\nYour full analysis is ready in **Portfolio X-Ray** in the sidebar!\n\n⚠️ *AI-generated analysis. Not licensed financial advice. Consult a SEBI-registered advisor.*`,
            900
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
                current_savings: newData.assets?.current_savings ?? 0,
                expected_return: getExpectedReturn(newData),
              });
              await addBotMessage(`Here's the update for retiring at age ${newRetire}:`, 500);
              await addResultCard('fire_result', result, newRetire, 700);
            } else {
              await addBotMessage("Please enter a retirement age higher than your current age!");
            }
          } else {
            await addBotMessage(
              "I've shared your complete analysis above! 📊\n\nUse the **sidebar tools** for deeper dives — Tax Optimizer, FIRE Planner, Money Health Score, or Portfolio X-Ray. Or say **\"start over\"** to begin fresh!"
            );
          }
          break;
        }
      }

      if (nextStep !== currentStep) setStep(nextStep);
    },
    [addBotMessage, addResultCard, collected, runTaxAndAskFire, user, fundCount, pendingFund]
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
    if (d.income?.base_salary) score += 10;
    if (d.demographics?.city_type) score += 5;
    if (d.income?.hra_received !== undefined) score += 5;
    if (d.expenses?.rent_paid_monthly !== undefined) score += 5;
    if (d.assets?.deduction_80c !== undefined) score += 5;
    if (d.assets?.deduction_80d !== undefined) score += 5;
    if (d.assets?.nps_80ccd !== undefined) score += 5;
    if (d.demographics?.age) score += 5;
    if (d.demographics?.employment_type) score += 5;
    if (d.demographics?.marital_status) score += 5;
    if (d.income?.secondary_income_monthly !== undefined) score += 5;
    if (d.income?.passive_income_monthly !== undefined) score += 5;
    if (d.assets?.has_term_insurance !== undefined) score += 5;
    if (d.assets?.monthly_sip !== undefined) score += 5;
    if (d.assets?.total_investments !== undefined) score += 5;
    if (d.liabilities?.home_loan_emi !== undefined) score += 5;
    if (d.liabilities?.credit_card_debt !== undefined) score += 5;
    if (d.assets?.emergency_months) score += 5;
    if (d.portfolio && d.portfolio.length > 0) score += 5;
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