import { useState, useRef, useCallback } from 'react';
import { calculateTax, calculateFIRE, type TaxResponse, type FireResponse } from '../utils/finCalc';

// ── Types ──────────────────────────────────────────────────────────────────
export type ChatMessage =
  | { id: string; role: 'bot'; type: 'text'; content: string }
  | { id: string; role: 'user'; content: string }
  | { id: string; role: 'bot'; type: 'typing' }
  | { id: string; role: 'bot'; type: 'tax_result'; data: TaxResponse }
  | { id: string; role: 'bot'; type: 'fire_result'; data: FireResponse; retireAge: number };

export interface CollectedData {
  salary?: number;
  hra_received?: number;
  rent_paid?: number;
  city_type?: 'metro' | 'non-metro';
  deduction_80c?: number;
  deduction_80d?: number;
  nps_80ccd?: number;
  current_age?: number;
  retire_age?: number;
  annual_income?: number;
  monthly_expense?: number;
  current_savings?: number;
}

type ConversationStep =
  | 'salary'
  | 'rent'
  | 'hra'
  | 'deduction80c'
  | 'nps'
  | 'tax_computing'
  | 'ask_fire'
  | 'fire_age'
  | 'fire_expenses'
  | 'fire_savings'
  | 'fire_computing'
  | 'done';

// ── Parsers ────────────────────────────────────────────────────────────────
function parseAmount(text: string): number | null {
  const clean = text.replace(/[₹,\s]/g, '').toLowerCase();

  const croreMatch = clean.match(/(\d+\.?\d*)\s*(?:cr(?:ore)?)/);
  if (croreMatch) return parseFloat(croreMatch[1]) * 10_000_000;

  const lakhMatch = clean.match(/(\d+\.?\d*)\s*(?:lakh|l(?!\w))/);
  if (lakhMatch) return parseFloat(lakhMatch[1]) * 1_00_000;

  const kMatch = clean.match(/(\d+\.?\d*)k(?!\w)/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  const numMatch = clean.match(/(\d{4,}\.?\d*)/);
  if (numMatch) return parseFloat(numMatch[1]);

  // Small plain numbers (age, etc.)
  const smallNum = clean.match(/^(\d{1,3})$/);
  if (smallNum) return parseFloat(smallNum[1]);

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

// ── Script ────────────────────────────────────────────────────────────────
const OPENING_MSG =
  "Hi! I'm FinPilot 👋 I'll help you find the best tax regime and plan your FIRE retirement — through a quick chat. Let's start!\n\nWhat's your **annual salary (CTC)**? (e.g. \"18 lakhs\" or \"18L\")";

const QUICK_REPLIES: Record<ConversationStep, string[]> = {
  salary: ['₹12L', '₹18L', '₹24L', '₹36L'],
  rent: ['Yes, Metro city', 'Yes, Non-metro', 'No, I don\'t pay rent'],
  hra: ['₹3.6L per year', '₹2L per year', 'Not sure'],
  deduction80c: ['₹1.5L — maxed out', '₹1L', '₹50K', 'None'],
  nps: ['₹50,000', '₹25,000', 'No NPS'],
  tax_computing: [],
  ask_fire: ['Yes, plan my retirement 🔥', 'Show detailed breakdown', 'Start over'],
  fire_age: ['30 yrs, retire at 50', '28 yrs, retire at 45', '35 yrs, retire at 55'],
  fire_expenses: ['₹50K/month', '₹80K/month', '₹1.2L/month'],
  fire_savings: ['₹15L', '₹50L', 'Nothing yet'],
  fire_computing: [],
  done: ['What if I retire at 55?', 'Show fund suggestions', 'Start over'],
};

// ── Hook ──────────────────────────────────────────────────────────────────
export function useChatBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: 'bot', type: 'text', content: OPENING_MSG },
  ]);
  const [step, setStep] = useState<ConversationStep>('salary');
  const [collected, setCollected] = useState<CollectedData>({});
  const [taxResult, setTaxResult] = useState<TaxResponse | null>(null);
  const [fireResult, setFireResult] = useState<FireResponse | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingIdRef = useRef<string | null>(null);

  const addBotMessage = useCallback((content: string, delay = 900) => {
    const typingId = uid();
    typingIdRef.current = typingId;
    setIsTyping(true);
    setMessages((prev) => [...prev, { id: typingId, role: 'bot', type: 'typing' }]);

    return new Promise<void>((resolve) =>
      setTimeout(() => {
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== typingId)
            .concat({ id: uid(), role: 'bot', type: 'text', content })
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

  const processStep = useCallback(
    async (userText: string, currentStep: ConversationStep, currentCollected: CollectedData) => {
      let nextStep = currentStep;
      let newData = { ...currentCollected };

      // ── Parse based on current step ──
      switch (currentStep) {
        case 'salary': {
          const amount = parseAmount(userText);
          if (amount && amount > 1000) {
            newData.salary = amount;
            newData.annual_income = amount;
            setCollected(newData);
            nextStep = 'rent';
            await addBotMessage(
              `Got it ✓ ₹${(amount / 100000).toFixed(1)}L salary noted!\n\nDo you live in a metro city (Mumbai, Delhi, Bengaluru etc.) and pay rent? If yes, how much per month?`
            );
          } else {
            await addBotMessage(
              "I didn't quite catch that. Could you share your annual salary? For example \"18 lakhs\" or \"₹18L\"?"
            );
          }
          break;
        }

        case 'rent': {
          const city = detectCity(userText);
          const yesNo = parseYesNo(userText);
          const rentAmt = parseAmount(userText);

          if (yesNo === false || userText.toLowerCase().includes("don't") || userText.toLowerCase().includes('no rent')) {
            newData.city_type = 'non-metro';
            newData.rent_paid = 0;
            newData.hra_received = 0;
            setCollected(newData);
            nextStep = 'deduction80c';
            await addBotMessage(
              "No worries! HRA exemption skipped.\n\nHave you made any **80C investments**? (PPF, ELSS, LIC, EPF etc.) What's the total amount? Max is ₹1.5L."
            );
          } else {
            if (city) newData.city_type = city;
            if (rentAmt && rentAmt > 100) newData.rent_paid = rentAmt;
            setCollected(newData);
            nextStep = 'hra';
            await addBotMessage(
              `${city ? `${city === 'metro' ? 'Metro' : 'Non-metro'} noted ✓` : 'Got it ✓'}\n\nWhat's your **HRA component** in your salary slip? (Usually a separate line item — e.g. "3.6 lakhs per year")`
            );
          }
          break;
        }

        case 'hra': {
          const amount = parseAmount(userText);
          if (amount) {
            newData.hra_received = amount;
            setCollected(newData);
            nextStep = 'deduction80c';
            await addBotMessage(
              `HRA ₹${(amount / 100000).toFixed(1)}L noted ✓\n\nHave you made any **80C investments**? (PPF, ELSS, LIC, EPF etc.) What's the total? Max deduction is ₹1.5L.`
            );
          } else {
            newData.hra_received = 0;
            setCollected(newData);
            nextStep = 'deduction80c';
            await addBotMessage(
              `No HRA noted. Moving on!\n\nHave you made any **80C investments**? (PPF, ELSS, LIC, EPF etc.) Max is ₹1.5L.`
            );
          }
          break;
        }

        case 'deduction80c': {
          const yesNo = parseYesNo(userText);
          const amount = parseAmount(userText);
          const isMaxed = /maxed|max|full|1\.5|150000/.test(userText.toLowerCase());

          if (yesNo === false || userText.toLowerCase() === 'none') {
            newData.deduction_80c = 0;
            setCollected(newData);
            nextStep = 'nps';
            await addBotMessage(
              "Okay, no 80C deductions noted.\n\nAny **NPS contribution** under Section 80CCD(1B)? This gives an extra ₹50K deduction — very tax-efficient!"
            );
          } else {
            const finalAmt = isMaxed ? 150000 : amount ? Math.min(amount, 150000) : 150000;
            newData.deduction_80c = finalAmt;
            setCollected(newData);
            nextStep = 'nps';
            await addBotMessage(
              `Nice! ₹${(finalAmt / 100000).toFixed(1)}L in 80C investments ✓\n\nAny **NPS contribution** under 80CCD(1B)? This gives an extra ₹50K deduction!`
            );
          }
          break;
        }

        case 'nps': {
          const yesNo = parseYesNo(userText);
          const amount = parseAmount(userText);

          if (yesNo === false || userText.toLowerCase() === 'no nps' || userText.toLowerCase().includes('no nps')) {
            newData.nps_80ccd = 0;
          } else {
            newData.nps_80ccd = amount ? Math.min(amount, 50000) : 50000;
          }
          newData.deduction_80d = 25000; // sensible default
          setCollected(newData);
          nextStep = 'tax_computing';

          // Run tax calculation
          await addBotMessage('Got all your tax data! Calculating now... 🧮', 600);

          setTimeout(async () => {
            const taxInputs = {
              salary: newData.salary || 0,
              hra_received: newData.hra_received || 0,
              rent_paid: newData.rent_paid || 0,
              city_type: newData.city_type || 'metro',
              deduction_80c: newData.deduction_80c || 0,
              deduction_80d: newData.deduction_80d || 0,
              nps_80ccd: newData.nps_80ccd || 0,
            };
            const result = calculateTax(taxInputs);
            setTaxResult(result);

            await addResultCard('tax_result', result, undefined, 800);

            setTimeout(async () => {
              nextStep = 'ask_fire';
              setStep('ask_fire');
              await addBotMessage(
                `Want me to also plan your **FIRE retirement**? 🎯\n\nJust tell me your age and when you want to retire — I'll build a full corpus and SIP plan!`,
                700
              );
            }, 400);
          }, 300);
          break;
        }

        case 'ask_fire': {
          const lower = userText.toLowerCase();
          if (/start over|restart|reset/.test(lower)) {
            window.location.reload();
            return;
          }
          if (/breakdown|detail|more/.test(lower)) {
            await addBotMessage(
              "Your full breakdown is visible in the **Summary Panel** on the right 👉\n\nNow — want to plan your FIRE retirement? Tell me your age and target retirement age!"
            );
            nextStep = 'fire_age';
          } else {
            nextStep = 'fire_age';
            await addBotMessage(
              "Great! Let's plan your retirement 🔥\n\nHow **old are you** and at what age do you want to **retire**? (e.g. \"I'm 34, want to retire at 50\")"
            );
          }
          break;
        }

        case 'fire_age': {
          // Try to extract two ages from the message
          const nums = userText.match(/\d+/g)?.map(Number) ?? [];
          let age = 0, retireAge = 0;

          if (nums.length >= 2) {
            age = nums[0];
            retireAge = nums[1];
          } else if (nums.length === 1) {
            age = nums[0];
            retireAge = 50; // default
          }

          if (age >= 18 && retireAge > age) {
            newData.current_age = age;
            newData.retire_age = retireAge;
            setCollected(newData);
            nextStep = 'fire_expenses';
            await addBotMessage(
              `Age ${age}, retiring at ${retireAge} — noted ✓\n\nWhat are your **monthly expenses** roughly? And do you have any existing savings/investments?`
            );
          } else {
            await addBotMessage(
              "Could you share your current age and target retirement age? For example: \"I'm 34, want to retire at 50\""
            );
          }
          break;
        }

        case 'fire_expenses': {
          const amount = parseAmount(userText);
          if (amount && amount > 100) {
            newData.monthly_expense = amount;
            setCollected(newData);
            nextStep = 'fire_savings';
            await addBotMessage(
              `₹${amount >= 100000 ? (amount / 100000).toFixed(1) + 'L' : (amount / 1000).toFixed(0) + 'K'}/month expenses noted ✓\n\nAny **current savings or investments**? (e.g. "15 lakhs", "50 lakhs", or "nothing yet")`
            );
          } else {
            await addBotMessage(
              "How much do you spend monthly? For example: \"₹80,000/month\" or \"80K per month\""
            );
          }
          break;
        }

        case 'fire_savings': {
          const amount = parseAmount(userText);
          const isNone = /nothing|zero|none|no|nil|nahi/.test(userText.toLowerCase());
          newData.current_savings = isNone ? 0 : (amount || 0);
          setCollected(newData);
          nextStep = 'fire_computing';

          await addBotMessage('Building your FIRE plan... 🔥', 600);

          setTimeout(async () => {
            const fireInputs = {
              current_age: newData.current_age || 30,
              retire_age: newData.retire_age || 50,
              annual_income: newData.annual_income || newData.salary || 1200000,
              monthly_expense: newData.monthly_expense || 60000,
              current_savings: newData.current_savings || 0,
              expected_return: 12,
            };
            const result = calculateFIRE(fireInputs);
            setFireResult(result);

            await addResultCard('fire_result', result, fireInputs.retire_age, 900);

            setTimeout(async () => {
              nextStep = 'done';
              setStep('done');
              const f = result.feasibility;
              await addBotMessage(
                `Your plan is ${f === 'on track' ? 'on track — great work! 🎉' : f === 'stretch goal' ? 'ambitious but doable 💪' : 'challenging but let\'s fix it ⚡'} The biggest lever is starting your **₹${result.sip_per_month.toLocaleString('en-IN')}/month SIP** today. Consistency beats timing every time.\n\n*Not financial advice — consult a SEBI-registered advisor.*`,
                800
              );
            }, 400);
          }, 300);
          break;
        }

        case 'fire_computing':
        case 'done': {
          const lower = userText.toLowerCase();
          if (/start over|restart|reset/.test(lower)) {
            window.location.reload();
          } else if (/retire at (\d+)|what if/.test(lower)) {
            const match = lower.match(/(\d+)/);
            const newRetire = match ? parseInt(match[1]) : (collected.retire_age || 50) + 5;
            if (newRetire > (collected.current_age || 30)) {
              const upd = { ...newData, retire_age: newRetire };
              const result = calculateFIRE({
                current_age: upd.current_age || 30,
                retire_age: newRetire,
                annual_income: upd.annual_income || 1200000,
                monthly_expense: upd.monthly_expense || 60000,
                current_savings: upd.current_savings || 0,
                expected_return: 12,
              });
              await addBotMessage(`Here's the update for retiring at age ${newRetire}:`, 500);
              await addResultCard('fire_result', result, newRetire, 700);
            } else {
              await addBotMessage("Please enter a retirement age higher than your current age!");
            }
          } else {
            await addBotMessage(
              "I've shared your complete Tax and FIRE analysis above! 📊\n\nYou can use the **sidebar tools** for deeper dives — Tax Optimizer, FIRE Planner, Money Health Score, or Portfolio X-Ray.\n\nFeel free to ask anything else or say **\"start over\"** to begin fresh!"
            );
          }
          break;
        }
      }

      if (nextStep !== currentStep) setStep(nextStep);
    },
    [addBotMessage, addResultCard, collected]
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

  const progress = (() => {
    const fields = ['salary', 'city_type', 'hra_received', 'deduction_80c', 'nps_80ccd'];
    const fireFields = ['current_age', 'retire_age', 'monthly_expense', 'current_savings'];
    const total = step === 'done' || fireResult ? fields.length + fireFields.length : fields.length;
    const done =
      fields.filter((k) => (collected as any)[k] !== undefined).length +
      (step === 'done' || fireResult ? fireFields.filter((k) => (collected as any)[k] !== undefined).length : 0);
    return Math.round((done / total) * 100);
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
