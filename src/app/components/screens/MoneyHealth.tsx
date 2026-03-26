import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ArrowLeft, RefreshCcw } from 'lucide-react';
import {
  calculateHealthScore,
  type HealthInputs,
  type HealthResponse,
  type HealthDimensions,
} from '../../utils/finCalc';
import { AIExplanationCard } from '../shared/AIExplanationCard';
import { ActionCard } from '../shared/ActionCard';

// ── Wizard Step config ──
const STEPS = [
  'Emergency',
  'Insurance',
  'Investments',
  'Debt',
  'Tax',
  'Retirement',
];

const INITIAL_ANSWERS: HealthInputs = {
  emergency_months: '3-6',
  has_term_insurance: false,
  has_health_insurance: false,
  monthly_sip: 15000,
  total_investments: 500000,
  has_home_loan: false,
  monthly_emi: 0,
  tax_regime_optimized: false,
  annual_income: 1200000,
  epf_nps_contribution: 50000,
};

const scoreColor = (s: number) => (s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444');

const dimensionLabels: Record<keyof HealthDimensions, string> = {
  emergency: 'Emergency Fund',
  insurance: 'Insurance Coverage',
  investments: 'Investments',
  debt: 'Debt Health',
  tax_efficiency: 'Tax Efficiency',
  retirement: 'Retirement Readiness',
};

function CircularGauge({ score }: { score: number }) {
  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="14" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px`, fontFamily: 'Inter, sans-serif' }}
        >
          <tspan fontSize="42" fontWeight="700" fill={color}>
            {score}
          </tspan>
          <tspan fontSize="18" fill="#94A3B8">
            /100
          </tspan>
        </text>
      </svg>
    </div>
  );
}

export function MoneyHealth() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0-5
  const [answers, setAnswers] = useState<HealthInputs>(INITIAL_ANSWERS);
  const [result, setResult] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof HealthInputs) => (val: any) => setAnswers((p) => ({ ...p, [k]: val }));
  const setNum = (k: keyof HealthInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k)(Number(e.target.value));

  const handleNext = () => {
    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        setResult(calculateHealthScore(answers));
        setLoading(false);
      }, 800);
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null);
      setStep(5);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(0);
    setAnswers(INITIAL_ANSWERS);
  };

  const btnOpt = (active: boolean) =>
    `w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
      active
        ? 'bg-[#6366F1] border-[#6366F1] text-white'
        : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1] hover:bg-[#EEF2FF]'
    }`;

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20';
  const labelClass = 'block text-[#374151] text-sm font-medium mb-1.5';

  const ctaRoutes: Partial<Record<keyof HealthDimensions, string>> = {
    retirement: '/fire',
    tax_efficiency: '/tax',
    investments: '/portfolio',
  };

  // ── Result view ──
  if (result) {
    const gradeVariant =
      result.grade === 'Excellent'
        ? 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]'
        : result.grade === 'Good'
        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
        : result.grade === 'Fair'
        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
        : 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]';

    return (
      <div className="p-6 md:p-8 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#0F172A] font-bold text-2xl">Money Health Score</h2>
            <p className="text-[#64748B] text-sm mt-1">Your financial wellness report</p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] text-sm hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Retake
          </button>
        </div>

        {/* Score + Grade */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col items-center">
          <CircularGauge score={result.overall_score} />
          <span className={`mt-2 px-4 py-1.5 rounded-full border text-sm font-semibold ${gradeVariant}`}>
            {result.grade} — Room to improve
          </span>
        </div>

        {/* Dimension Cards */}
        <div>
          <h3 className="text-[#0F172A] font-semibold text-base mb-3">Score Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.entries(result.dimensions) as [keyof HealthDimensions, number][]).map(([key, val]) => (
              <div key={key} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#374151] text-sm font-medium">{dimensionLabels[key]}</span>
                  <span className="text-sm font-bold" style={{ color: scoreColor(val) }}>
                    {val}/100
                  </span>
                </div>
                <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${val}%`, background: scoreColor(val) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Actions */}
        <div>
          <h3 className="text-[#0F172A] font-semibold text-base mb-3">Priority Actions</h3>
          <div className="flex flex-col md:flex-row gap-3">
            {result.priority_actions.map((action) => (
              <ActionCard
                key={action.dimension}
                severity={action.severity}
                title={action.title}
                description={action.description}
                ctaLabel={action.cta}
                onCtaClick={() => {
                  const route = ctaRoutes[action.dimension];
                  if (route) navigate(route);
                }}
              />
            ))}
          </div>
        </div>

        {/* AI Card */}
        <AIExplanationCard text={result.reasoning} />
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#64748B] text-sm">Analyzing your financial health...</p>
      </div>
    );
  }

  // ── Wizard ──
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-1 flex-wrap">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`text-xs font-medium ${i <= step ? 'text-[#6366F1]' : 'text-[#94A3B8]'}`}
              >
                {s}{i < STEPS.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
          <span className="text-[#64748B] text-xs font-medium">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6366F1] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
        {/* Step 0 — Emergency Fund */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Emergency Fund</h3>
              <p className="text-[#64748B] text-sm mt-1">How many months of expenses can you cover without income?</p>
            </div>
            <div className="space-y-2.5 mt-4">
              {([['<1', 'Less than 1 month'], ['1-3', '1–3 months'], ['3-6', '3–6 months'], ['>6', 'More than 6 months']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => set('emergency_months')(val)}
                  className={btnOpt(answers.emergency_months === val)}
                >
                  <span className="flex items-center justify-between">
                    {label}
                    {answers.emergency_months === val && <span>✓</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Insurance */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Insurance</h3>
              <p className="text-[#64748B] text-sm mt-1">Do you have adequate insurance coverage?</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">Do you have term life insurance?</p>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => set('has_term_insurance')(v === 'Yes')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        answers.has_term_insurance === (v === 'Yes')
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">Do you have health insurance?</p>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => set('has_health_insurance')(v === 'Yes')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        answers.has_health_insurance === (v === 'Yes')
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Investments */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Investments</h3>
              <p className="text-[#64748B] text-sm mt-1">Tell us about your current investments</p>
            </div>
            <div className="space-y-3 mt-4">
              <div>
                <label className={labelClass}>Monthly SIP Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                  <input type="number" className={`${inputClass} pl-7`} value={answers.monthly_sip} onChange={setNum('monthly_sip')} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Total Investment Value (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                  <input type="number" className={`${inputClass} pl-7`} value={answers.total_investments} onChange={setNum('total_investments')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Debt */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Debt Health</h3>
              <p className="text-[#64748B] text-sm mt-1">Let us assess your debt situation</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">Do you have a home or car loan?</p>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => set('has_home_loan')(v === 'Yes')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        answers.has_home_loan === (v === 'Yes')
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              {answers.has_home_loan && (
                <div>
                  <label className={labelClass}>Monthly EMI (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                    <input type="number" className={`${inputClass} pl-7`} value={answers.monthly_emi} onChange={setNum('monthly_emi')} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4 — Tax */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Tax Efficiency</h3>
              <p className="text-[#64748B] text-sm mt-1">Have you optimized your tax situation?</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">
                  Have you compared and chosen the optimal tax regime this year?
                </p>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => set('tax_regime_optimized')(v === 'Yes')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        answers.tax_regime_optimized === (v === 'Yes')
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Retirement */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Retirement Readiness</h3>
              <p className="text-[#64748B] text-sm mt-1">How prepared are you for retirement?</p>
            </div>
            <div className="space-y-3 mt-4">
              <div>
                <label className={labelClass}>Annual Income (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                  <input type="number" className={`${inputClass} pl-7`} value={answers.annual_income} onChange={setNum('annual_income')} />
                </div>
              </div>
              <div>
                <label className={labelClass}>EPF + NPS Contribution per year (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                  <input type="number" className={`${inputClass} pl-7`} value={answers.epf_nps_contribution} onChange={setNum('epf_nps_contribution')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#F1F5F9]">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-[#64748B] text-sm hover:text-[#0F172A] disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold transition-colors"
          >
            {step === 5 ? 'See my score' : 'Next'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
