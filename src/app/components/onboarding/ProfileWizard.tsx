import { useState } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Building2,
  GraduationCap,
  UserX,
  Coffee,
  MapPin,
  Users,
  TrendingUp,
  Home,
  PiggyBank,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useProfileWizard, WIZARD_STEPS } from '../../hooks/useProfileWizard';
import type { CollectedData } from '../../hooks/useCollectedData';

// ── Helpers ───────────────────────────────────────────────────────────────
function fmt(n: number, unit = 'L') {
  if (!n) return '—';
  if (unit === 'L') return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function AmountInput({
  label,
  hint,
  value,
  onChange,
  chips,
  prefix = '₹',
  suffix = '',
}: {
  label: string;
  hint?: string;
  value: number | undefined;
  onChange: (v: number) => void;
  chips?: { label: string; value: number }[];
  prefix?: string;
  suffix?: string;
}) {
  const [raw, setRaw] = useState(value ? String(value) : '');

  const commit = (str: string) => {
    const clean = str.replace(/[₹,\s]/g, '').toLowerCase();
    const cr = clean.match(/(\d+\.?\d*)\s*(?:cr(?:ore)?)/);
    if (cr) { onChange(parseFloat(cr[1]) * 1_00_00_000); return; }
    const lk = clean.match(/(\d+\.?\d*)\s*(?:lakh|l(?!\w))/);
    if (lk) { onChange(parseFloat(lk[1]) * 1_00_000); return; }
    const kk = clean.match(/(\d+\.?\d*)k(?!\w)/);
    if (kk) { onChange(parseFloat(kk[1]) * 1000); return; }
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 0) onChange(num);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[#0F172A] text-sm font-semibold">{label}</label>
      {hint && <p className="text-[#64748B] text-xs -mt-1">{hint}</p>}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => { setRaw(String(c.value)); onChange(c.value); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                value === c.value
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:border-[#6366F1] hover:text-[#6366F1]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#6366F1]/20 transition-all">
        {prefix && <span className="text-[#94A3B8] font-medium">{prefix}</span>}
        <input
          type="text"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={() => commit(raw)}
          placeholder="e.g. 18 lakhs or 18L"
          className="flex-1 bg-transparent text-[#0F172A] text-sm outline-none placeholder-[#CBD5E1]"
        />
        {suffix && <span className="text-[#94A3B8] text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Step Components ────────────────────────────────────────────────────────

function StepEmployment({ data, setDemographics }: Pick<ReturnType<typeof useProfileWizard>, 'data' | 'setDemographics'>) {
  const options = [
    { value: 'salaried', label: 'Salaried', icon: Briefcase, desc: 'Full-time employee' },
    { value: 'self-employed', label: 'Self-Employed', icon: Building2, desc: 'Business / Freelancer' },
    { value: 'student', label: 'Student', icon: GraduationCap, desc: 'In college or coaching' },
    { value: 'unemployed', label: 'Unemployed', icon: UserX, desc: 'Between jobs' },
    { value: 'retired', label: 'Retired', icon: Coffee, desc: 'Living the FIRE dream!' },
  ] as const;

  const selected = data.demographics?.employment_type;

  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDemographics({ employment_type: opt.value })}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200 ${
              active
                ? 'border-[#6366F1] bg-[#EEF2FF] shadow-sm shadow-indigo-100'
                : 'border-[#E2E8F0] bg-white hover:border-[#A5B4FC] hover:bg-[#F8FAFC]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              active ? 'bg-[#6366F1] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-semibold text-sm ${active ? 'text-[#4338CA]' : 'text-[#0F172A]'}`}>{opt.label}</p>
              <p className="text-[#94A3B8] text-xs">{opt.desc}</p>
            </div>
            {active && (
              <CheckCircle2 className="w-5 h-5 text-[#6366F1] ml-auto flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function StepProfile({ data, setDemographics }: Pick<ReturnType<typeof useProfileWizard>, 'data' | 'setDemographics'>) {
  const d = data.demographics ?? {};
  return (
    <div className="flex flex-col gap-6">
      {/* Age */}
      <div className="flex flex-col gap-2">
        <label className="text-[#0F172A] text-sm font-semibold">Your Age</label>
        <div className="flex gap-2 flex-wrap">
          {[22, 25, 28, 30, 35, 40, 45, 50].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setDemographics({ age: a })}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                d.age === a
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:border-[#6366F1]'
              }`}
            >
              {a}
            </button>
          ))}
          <input
            type="number"
            placeholder="Other age"
            value={d.age && ![22,25,28,30,35,40,45,50].includes(d.age) ? d.age : ''}
            onChange={(e) => setDemographics({ age: parseInt(e.target.value) || undefined })}
            className="w-28 px-3 py-2 rounded-full border border-[#E2E8F0] text-sm outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
          />
        </div>
      </div>

      {/* City Type */}
      <div className="flex flex-col gap-2">
        <label className="text-[#0F172A] text-sm font-semibold flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#6366F1]" /> Where do you live?
        </label>
        <p className="text-[#64748B] text-xs -mt-1">Affects HRA exemption calculation</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { v: 'metro', label: 'Metro', eg: 'Mumbai, Delhi…' },
            { v: 'non-metro', label: 'Non-Metro', eg: 'Pune, Jaipur…' },
            { v: 'rural', label: 'Rural', eg: 'Tier 3 / Village' },
          ] as const).map((c) => (
            <button
              key={c.v}
              type="button"
              onClick={() => setDemographics({ city_type: c.v })}
              className={`flex flex-col gap-0.5 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                d.city_type === c.v
                  ? 'border-[#6366F1] bg-[#EEF2FF]'
                  : 'border-[#E2E8F0] bg-white hover:border-[#A5B4FC]'
              }`}
            >
              <span className={`text-sm font-semibold ${d.city_type === c.v ? 'text-[#4338CA]' : 'text-[#0F172A]'}`}>{c.label}</span>
              <span className="text-[#94A3B8] text-xs">{c.eg}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Marital Status */}
      <div className="flex flex-col gap-2">
        <label className="text-[#0F172A] text-sm font-semibold flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#6366F1]" /> Marital Status
        </label>
        <div className="flex gap-3">
          {(['single', 'married'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDemographics({ marital_status: m })}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all capitalize ${
                d.marital_status === m
                  ? 'border-[#6366F1] bg-[#EEF2FF] text-[#4338CA]'
                  : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#A5B4FC]'
              }`}
            >
              {m === 'single' ? '🧑 Single' : '💑 Married'}
            </button>
          ))}
        </div>
      </div>

      {/* Dependents */}
      <div className="flex flex-col gap-2">
        <label className="text-[#0F172A] text-sm font-semibold">Dependents</label>
        <p className="text-[#64748B] text-xs -mt-1">Children + dependent parents</p>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDemographics({ dependents: n })}
              className={`w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                d.dependents === n
                  ? 'border-[#6366F1] bg-[#6366F1] text-white'
                  : 'border-[#E2E8F0] bg-white text-[#334155] hover:border-[#6366F1]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepIncome({ data, setIncome }: Pick<ReturnType<typeof useProfileWizard>, 'data' | 'setIncome'>) {
  const isSalaried = data.demographics?.employment_type === 'salaried';
  return (
    <div className="flex flex-col gap-6">
      <AmountInput
        label={isSalaried ? 'Annual CTC (Gross Salary)' : 'Annual Business Income'}
        hint={isSalaried ? 'The total Cost to Company from your offer letter' : 'Average monthly profit × 12'}
        value={data.income?.base_salary}
        onChange={(v) => setIncome({ base_salary: v })}
        chips={[
          { label: '₹8L', value: 800_000 },
          { label: '₹12L', value: 1_200_000 },
          { label: '₹18L', value: 1_800_000 },
          { label: '₹24L', value: 2_400_000 },
          { label: '₹36L', value: 3_600_000 },
          { label: '₹50L+', value: 5_000_000 },
        ]}
      />

      <div className="flex flex-col gap-2">
        <label className="text-[#0F172A] text-sm font-semibold flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#6366F1]" /> Expected Annual Income Growth
        </label>
        <p className="text-[#64748B] text-xs -mt-1">For FIRE projection accuracy</p>
        <div className="flex gap-2 flex-wrap">
          {[5, 8, 10, 12, 15, 20].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setIncome({ income_growth_pct: pct })}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                data.income?.income_growth_pct === pct
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:border-[#6366F1]'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepAllowances({ data, setIncome, setExpenses }: Pick<ReturnType<typeof useProfileWizard>, 'data' | 'setIncome' | 'setExpenses'>) {
  const isSalaried = data.demographics?.employment_type === 'salaried';
  const cityType = data.demographics?.city_type;

  return (
    <div className="flex flex-col gap-6">
      {isSalaried && (
        <AmountInput
          label="HRA Received (Annual)"
          hint="The HRA component in your salary slip"
          value={data.income?.hra_received}
          onChange={(v) => setIncome({ hra_received: v })}
          chips={[
            { label: '₹1.2L', value: 120_000 },
            { label: '₹2.4L', value: 240_000 },
            { label: '₹3.6L', value: 360_000 },
            { label: '₹4.8L', value: 480_000 },
          ]}
        />
      )}

      <div className="flex flex-col gap-2">
        <label className="text-[#0F172A] text-sm font-semibold flex items-center gap-1.5">
          <Home className="w-4 h-4 text-[#6366F1]" /> Monthly Rent Paid
        </label>
        <p className="text-[#64748B] text-xs -mt-1">
          {cityType === 'metro'
            ? '⚡ Metro city — max HRA exemption applies'
            : cityType === 'non-metro'
            ? '📍 Non-metro — 40% HRA exemption applies'
            : 'Leave at 0 if you own your home'}
        </p>
        <div className="flex gap-2 flex-wrap mb-1">
          {[0, 10_000, 20_000, 30_000, 50_000, 75_000].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setExpenses({ rent_paid_monthly: v })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                data.expenses?.rent_paid_monthly === v
                  ? 'bg-[#6366F1] text-white border-[#6366F1]'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:border-[#6366F1]'
              }`}
            >
              {v === 0 ? 'Own home' : `₹${(v / 1000).toFixed(0)}K`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#6366F1]/20 transition-all">
          <span className="text-[#94A3B8] font-medium">₹</span>
          <input
            type="number"
            value={data.expenses?.rent_paid_monthly ?? ''}
            onChange={(e) => setExpenses({ rent_paid_monthly: parseFloat(e.target.value) || 0 })}
            placeholder="Enter monthly rent"
            className="flex-1 bg-transparent text-[#0F172A] text-sm outline-none placeholder-[#CBD5E1]"
          />
          <span className="text-[#94A3B8] text-xs">/month</span>
        </div>
      </div>
    </div>
  );
}

function StepInvestments({ data, setAssets }: Pick<ReturnType<typeof useProfileWizard>, 'data' | 'setAssets'>) {
  return (
    <div className="flex flex-col gap-6">
      {/* 80C */}
      <div className="flex flex-col gap-2">
        <AmountInput
          label="80C Investments (EPF + PPF + ELSS + LIC)"
          hint="Maximum deduction: ₹1.5L — saves up to ₹46,800 in tax"
          value={data.assets?.deduction_80c}
          onChange={(v) => setAssets({ deduction_80c: Math.min(v, 150_000) })}
          chips={[
            { label: 'None', value: 0 },
            { label: '₹50K', value: 50_000 },
            { label: '₹1L', value: 100_000 },
            { label: '₹1.5L (max)', value: 150_000 },
          ]}
        />
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] transition-all duration-500"
              style={{ width: `${Math.min(((data.assets?.deduction_80c ?? 0) / 150_000) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[#6366F1] text-xs font-semibold">
            {Math.round(((data.assets?.deduction_80c ?? 0) / 150_000) * 100)}% of limit
          </span>
        </div>
      </div>

      {/* NPS */}
      <AmountInput
        label="NPS Contribution (Section 80CCD 1B)"
        hint="Extra ₹50K deduction over and above 80C — goes directly to your retirement fund"
        value={data.assets?.nps_80ccd}
        onChange={(v) => setAssets({ nps_80ccd: Math.min(v, 50_000) })}
        chips={[
          { label: 'None', value: 0 },
          { label: '₹25K', value: 25_000 },
          { label: '₹50K (max)', value: 50_000 },
        ]}
      />

      {/* Tip card */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#F0FDF4] border border-[#C7D2FE]">
        <PiggyBank className="w-5 h-5 text-[#6366F1] flex-shrink-0 mt-0.5" />
        <p className="text-[#3730A3] text-xs leading-relaxed">
          <strong>Pro tip:</strong> Maxing both 80C (₹1.5L) + NPS (₹50K) can save you up to{' '}
          <strong>₹62,400</strong> in taxes per year under the Old Regime!
        </p>
      </div>
    </div>
  );
}

function StepReview({ data }: { data: CollectedData }) {
  const d = data.demographics ?? {};
  const inc = data.income ?? {};
  const exp = data.expenses ?? {};
  const ast = data.assets ?? {};

  const rows = [
    { icon: '💼', label: 'Employment', value: d.employment_type ? d.employment_type.charAt(0).toUpperCase() + d.employment_type.slice(1) : '—' },
    { icon: '👤', label: 'Age', value: d.age ? `${d.age} years` : '—' },
    { icon: '📍', label: 'City', value: d.city_type ? d.city_type.charAt(0).toUpperCase() + d.city_type.slice(1) : '—' },
    { icon: '👨‍👩‍👧', label: 'Family', value: d.marital_status ? `${d.marital_status}, ${d.dependents ?? 0} dependent(s)` : '—' },
    { icon: '💰', label: 'Annual Income', value: inc.base_salary ? fmt(inc.base_salary) : '—' },
    { icon: '📈', label: 'Income Growth', value: inc.income_growth_pct ? `${inc.income_growth_pct}% p.a.` : '—' },
    { icon: '🏠', label: 'Monthly Rent', value: exp.rent_paid_monthly ? `₹${exp.rent_paid_monthly.toLocaleString('en-IN')}/mo` : 'Own home' },
    { icon: '🧾', label: 'HRA Received', value: inc.hra_received ? fmt(inc.hra_received) : '—' },
    { icon: '📊', label: '80C Investments', value: ast.deduction_80c !== undefined ? fmt(ast.deduction_80c) : '—' },
    { icon: '🏦', label: 'NPS (80CCD)', value: ast.nps_80ccd !== undefined ? `₹${ast.nps_80ccd.toLocaleString('en-IN')}` : '—' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#EEF2FF] to-[#F0FDF4] border border-[#C7D2FE]">
        <Sparkles className="w-5 h-5 text-[#6366F1]" />
        <p className="text-[#3730A3] text-sm font-semibold">Phase 2 will collect deeper data after your tax result!</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[#F1F5F9] hover:border-[#E2E8F0] transition-colors">
            <span className="text-base w-6 flex-shrink-0">{row.icon}</span>
            <span className="text-[#64748B] text-sm flex-1">{row.label}</span>
            <span className={`text-sm font-semibold ${row.value === '—' ? 'text-[#CBD5E1]' : 'text-[#0F172A]'}`}>{row.value}</span>
            {row.value !== '—' && <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────
interface ProfileWizardProps {
  onComplete: (data: CollectedData) => void;
}

export function ProfileWizard({ onComplete }: ProfileWizardProps) {
  const { step, data, canProceed, isFirstStep, isLastStep, setDemographics, setIncome, setExpenses, setAssets, next, prev, complete } =
    useProfileWizard();

  const handleNext = () => {
    if (isLastStep) {
      complete();
      onComplete(data);
    } else {
      next();
    }
  };

  const currentStep = WIZARD_STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex overflow-hidden" style={{ maxHeight: '90vh' }}>
        {/* ── Left: Stepper sidebar ── */}
        <div className="hidden md:flex flex-col w-56 bg-gradient-to-b from-[#1E1B4B] to-[#312E81] p-6 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">Arthmize</span>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            {WIZARD_STEPS.map((s, idx) => {
              const isPast = idx < step;
              const isCurrent = idx === step;
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300 ${
                      isPast ? 'bg-[#22C55E] text-white' : isCurrent ? 'bg-[#6366F1] text-white ring-4 ring-[#6366F1]/30' : 'bg-[#312E81] text-[#818CF8] border border-[#4338CA]'
                    }`}>
                      {isPast ? '✓' : s.icon}
                    </div>
                    {idx < WIZARD_STEPS.length - 1 && (
                      <div className={`w-0.5 h-6 mt-1 rounded-full transition-colors duration-300 ${isPast ? 'bg-[#22C55E]' : 'bg-[#4338CA]'}`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium transition-colors duration-300 ${isCurrent ? 'text-white' : isPast ? 'text-[#86EFAC]' : 'text-[#6B7280]'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-4">
            <p className="text-[#818CF8] text-xs leading-relaxed">
              🔒 Your data is private and never shared.
            </p>
          </div>
        </div>

        {/* ── Right: Step content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex-shrink-0">
            {/* Mobile progress bar */}
            <div className="md:hidden mb-4">
              <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                <span>Step {step + 1} of {WIZARD_STEPS.length}</span>
                <span>{Math.round((step / (WIZARD_STEPS.length - 1)) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#6366F1] transition-all duration-500"
                  style={{ width: `${Math.round(((step + 1) / WIZARD_STEPS.length) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{currentStep.icon}</span>
              <h2 className="text-[#0F172A] text-xl font-bold">{currentStep.title}</h2>
            </div>
            <p className="text-[#64748B] text-sm">{currentStep.subtitle}</p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-8 py-2">
            {step === 0 && <StepEmployment data={data} setDemographics={setDemographics} />}
            {step === 1 && <StepProfile data={data} setDemographics={setDemographics} />}
            {step === 2 && <StepIncome data={data} setIncome={setIncome} />}
            {step === 3 && <StepAllowances data={data} setIncome={setIncome} setExpenses={setExpenses} />}
            {step === 4 && <StepInvestments data={data} setAssets={setAssets} />}
            {step === 5 && <StepReview data={data} />}
          </div>

          {/* Footer nav */}
          <div className="px-8 py-6 border-t border-[#F1F5F9] flex items-center justify-between flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={prev}
              disabled={isFirstStep}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] border border-[#E2E8F0] hover:border-[#6366F1] hover:text-[#6366F1] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="hidden md:flex items-center gap-1.5">
              {WIZARD_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 h-2 bg-[#6366F1]' : i < step ? 'w-2 h-2 bg-[#A5B4FC]' : 'w-2 h-2 bg-[#E2E8F0]'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isLastStep
                  ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg shadow-indigo-200 hover:shadow-indigo-300'
                  : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white'
              }`}
            >
              {isLastStep ? '🚀 Start My Analysis' : 'Continue'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
