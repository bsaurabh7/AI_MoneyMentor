import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { calculateFIRE, formatINR, formatCr, type FireInputs, type FireResponse } from '../../utils/finCalc';
import { AIExplanationCard } from '../shared/AIExplanationCard';
import { MetricCard } from '../shared/MetricCard';
import { StatusPill } from '../shared/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { useFireRecommendations, type LiveSipFund, type LiveInsuranceRec } from '../../hooks/useFireRecommendations';
import { supabase } from '../../../lib/supabase';
import { PortfolioSummary } from '../shared/PortfolioSummary';

// ─── Helpers ───────────────────────────────────────────────────────────────

function ageFromDob(dob: string | null): number {
  if (!dob) return 30;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.max(18, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
}

function formatChartVal(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  return `₹${(v / 1000).toFixed(0)}K`;
}

// ─── Fund logic ─────────────────────────────────────────────────────────────

interface FundRec {
  name: string;
  category: string;
  allocation: number;   // % of total SIP
  suggestedSip: number; // computed from allocation
  returns: string;
  risk: string;
  badge: string;
  color: string;
}

interface InsuranceRec {
  type: string;
  coverRecommended: string;
  reason: string;
  urgency: 'high' | 'medium';
  icon: string;
}

function buildFundRecs(
  totalSip: number,
  riskProfile: string | null,
  expectedReturn: number,
  yearsToRetire: number,
): FundRec[] {
  const risk = riskProfile ?? (expectedReturn >= 12 ? 'aggressive' : expectedReturn >= 10 ? 'moderate' : 'conservative');

  const templates: Record<string, Omit<FundRec, 'allocation' | 'suggestedSip'>[]> = {
    aggressive: [
      { name: 'Parag Parikh Flexi Cap Fund', category: 'Flexi Cap', returns: '~16–18%', risk: 'Moderately High', badge: '★ Top Pick', color: '#6366F1' },
      { name: 'Nippon India Small Cap Fund', category: 'Small Cap', returns: '~18–22%', risk: 'High', badge: 'High Growth', color: '#EC4899' },
      { name: 'Mirae Asset Emerging Bluechip', category: 'Mid Cap', returns: '~15–18%', risk: 'Moderately High', badge: 'Strong Track', color: '#F59E0B' },
      { name: 'HDFC Nifty 50 Index Fund', category: 'Large Cap (Index)', returns: '~12–14%', risk: 'Moderate', badge: 'Stability', color: '#10B981' },
    ],
    moderate: [
      { name: 'Parag Parikh Flexi Cap Fund', category: 'Flexi Cap', returns: '~16–18%', risk: 'Moderately High', badge: '★ Top Pick', color: '#6366F1' },
      { name: 'Mirae Asset Large Cap Fund', category: 'Large Cap', returns: '~13–15%', risk: 'Moderate', badge: 'Steady', color: '#10B981' },
      { name: 'HDFC Mid-Cap Opportunities', category: 'Mid Cap', returns: '~15–17%', risk: 'Moderately High', badge: 'Growth', color: '#F59E0B' },
      { name: 'SBI Balanced Advantage Fund', category: 'Balanced Advantage', returns: '~10–12%', risk: 'Low-Moderate', badge: 'Balanced', color: '#3B82F6' },
    ],
    conservative: [
      { name: 'HDFC Nifty 50 Index Fund', category: 'Large Cap (Index)', returns: '~12–14%', risk: 'Moderate', badge: 'Core Hold', color: '#6366F1' },
      { name: 'SBI Balanced Advantage Fund', category: 'Balanced Advantage', returns: '~10–12%', risk: 'Low-Moderate', badge: 'Balanced', color: '#10B981' },
      { name: 'ICICI Pru Short Term Fund', category: 'Short Duration Debt', returns: '~7–8%', risk: 'Low', badge: 'Safety', color: '#64748B' },
      { name: 'UTI Nifty Next 50 Index Fund', category: 'Mid-Large Cap (Index)', returns: '~13–15%', risk: 'Moderate', badge: 'Diversified', color: '#F59E0B' },
    ],
  };

  const key = (risk as string) in templates ? (risk as string) : 'moderate';
  const allocations = yearsToRetire >= 15
    ? [40, 25, 25, 10]   // long horizon — more aggressive
    : yearsToRetire >= 8
    ? [35, 25, 25, 15]
    : [30, 20, 30, 20];  // short horizon — more stability

  return templates[key].map((t, i) => ({
    ...t,
    allocation: allocations[i],
    suggestedSip: Math.round((totalSip * allocations[i]) / 100 / 100) * 100, // round to nearest 100
  }));
}

function buildInsuranceRecs(
  hasTermInsurance: boolean | null,
  hasHealthInsurance: boolean | null,
  annualIncome: number,
  age: number,
): InsuranceRec[] {
  const recs: InsuranceRec[] = [];
  if (!hasTermInsurance) {
    const cover = Math.round((annualIncome * 15) / 10_00_000) * 10_00_000; // 15x income, round to nearest 10L
    recs.push({
      type: 'Term Life Insurance',
      coverRecommended: `${formatCr(cover)} cover`,
      reason: `At age ${age}, a pure term plan for ${formatCr(cover)} (15× annual income) costs just ₹800–1,500/month. It protects your family throughout your FIRE journey.`,
      urgency: age < 35 ? 'high' : 'high',
      icon: '🛡️',
    });
  }
  if (!hasHealthInsurance) {
    recs.push({
      type: 'Health Insurance',
      coverRecommended: '₹10–25 Lakh family floater',
      reason: 'A single hospitalisation without cover can wipe out months of SIP savings. Get a family floater before any medical episode drives up your premium.',
      urgency: 'high',
      icon: '🏥',
    });
  }
  if (hasTermInsurance && hasHealthInsurance) {
    // suggest top-up / super top-up
    recs.push({
      type: 'Super Top-Up Health Plan',
      coverRecommended: '₹50–1 Cr additional cover',
      reason: 'Both covers are in place — great! Consider a low-cost super top-up plan to extend coverage above your deductible at minimal premium.',
      urgency: 'medium',
      icon: '💚',
    });
  }
  return recs;
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-lg">
        <p className="text-[#64748B] text-xs mb-2">Age {label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs font-medium" style={{ color: p.color }}>
            {p.name}: {formatChartVal(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function AnalysisBreakdown({ form, result }: { form: FireInputs; result: FireResponse }) {
  const savingsRate = form.annual_income > 0
    ? ((result.sip_per_month * 12) / form.annual_income) * 100
    : 0;
  
  const totalAssets = (form.current_savings || 0) + (form.funds_value || 0);
  const fvTotalAssets = totalAssets * Math.pow(1 + form.expected_return / 100, result.years_to_retire);
  const shortfall = Math.max(0, result.corpus_needed - fvTotalAssets);

  const rows = [
    {
      label: 'Inflation-adjusted yearly expense at retirement',
      value: formatCr(result.annual_expense_at_retire),
      note: '6% inflation assumed',
    },
    {
      label: 'Future value of your current savings & funds',
      value: formatCr(Math.round(fvTotalAssets)),
      note: `at ${form.expected_return}% p.a. for ${result.years_to_retire} yrs`,
    },
    {
      label: 'Gap to be filled by SIP',
      value: formatCr(Math.round(shortfall)),
      note: shortfall === 0 ? 'No SIP needed! Savings cover it all.' : 'Bridge this with monthly SIP',
    },
    {
      label: 'Required savings rate',
      value: `${savingsRate.toFixed(1)}% of income`,
      note: savingsRate <= 20 ? 'Comfortable' : savingsRate <= 40 ? 'Disciplined' : 'Aggressive',
    },
    {
      label: 'Safe Withdrawal Rate used',
      value: '4% p.a.',
      note: 'Global FIRE standard (25× rule)',
    },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
      <h4 className="text-[#0F172A] font-semibold text-sm">📊 Analysis Breakdown</h4>
      <div className="divide-y divide-[#F1F5F9]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-[#374151] text-sm">{r.label}</p>
              <p className="text-[#94A3B8] text-xs">{r.note}</p>
            </div>
            <span className="text-[#0F172A] font-semibold text-sm whitespace-nowrap ml-3">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── Static fallback components (used when live pipeline errors) ─────────────

function FundRecommendations({ funds }: { funds: FundRec[] }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div>
        <h4 className="text-[#0F172A] font-semibold text-base">💼 Suggested SIPs &amp; Mutual Funds</h4>
        <p className="text-[#64748B] text-xs mt-0.5">Allocation based on your risk profile and retirement horizon</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {funds.map((f) => (
          <div key={f.name} className="border border-[#E2E8F0] rounded-xl p-4 hover:border-[#6366F1]/40 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] font-semibold text-sm leading-tight">{f.name}</p>
                <p className="text-[#64748B] text-xs mt-0.5">{f.category}</p>
              </div>
              <span className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0" style={{ backgroundColor: f.color }}>{f.badge}</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F5F9]">
              <div>
                <p className="text-[#94A3B8] text-xs">Suggested SIP</p>
                <p className="text-[#6366F1] font-bold text-base">{formatINR(f.suggestedSip)}<span className="text-xs font-normal text-[#94A3B8]">/mo</span></p>
              </div>
              <div className="text-right">
                <p className="text-[#94A3B8] text-xs">Expected returns</p>
                <p className="text-[#10B981] font-semibold text-sm">{f.returns}</p>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#94A3B8] text-xs">Allocation</span>
                <span className="text-[#374151] text-xs font-medium">{f.allocation}%</span>
              </div>
              <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${f.allocation}%`, backgroundColor: f.color }} />
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">Risk: <span className="text-[#374151] font-medium">{f.risk}</span></p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[#94A3B8] text-xs">⚠️ Illustrative suggestions only. Not SEBI-registered advice. Past performance is not a guarantee of future returns.</p>
    </div>
  );
}

function InsuranceRecommendations({ recs }: { recs: InsuranceRec[] }) {
  if (recs.length === 0) return null;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div>
        <h4 className="text-[#0F172A] font-semibold text-base">🛡️ Insurance Recommendations</h4>
        <p className="text-[#64748B] text-xs mt-0.5">Protect your FIRE journey against unexpected events</p>
      </div>
      <div className="space-y-3">
        {recs.map((r) => (
          <div key={r.type} className={`flex gap-4 p-4 rounded-xl border ${r.urgency === 'high' ? 'bg-[#FFF7ED] border-[#FED7AA]' : 'bg-[#F0FDF4] border-[#BBF7D0]'}`}>
            <span className="text-2xl">{r.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-[#0F172A] font-semibold text-sm">{r.type}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.urgency === 'high' ? 'bg-[#F97316] text-white' : 'bg-[#10B981] text-white'}`}>
                  {r.urgency === 'high' ? 'RECOMMENDED' : 'OPTIONAL'}
                </span>
              </div>
              <p className="text-[#6366F1] font-semibold text-sm mb-1">{r.coverRecommended}</p>
              <p className="text-[#64748B] text-xs leading-relaxed">{r.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Live Fund Recommendations (from Qwen/HuggingFace pipeline) ─────────────

function RecsShimmer() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#EEF2FF] to-[#F0FDF4] border border-[#C7D2FE]">
        <span className="text-xl animate-bounce">🍳</span>
        <div>
          <p className="text-[#3730A3] font-semibold text-sm">Something good is cooking for you…</p>
          <p className="text-[#6366F1] text-xs">Fetching live market data from ValueResearch, ET Money &amp; Groww</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border border-[#F1F5F9] rounded-xl p-4 space-y-3">
            <div className="h-4 bg-[#F1F5F9] rounded animate-pulse w-3/4" />
            <div className="h-3 bg-[#F1F5F9] rounded animate-pulse w-1/2" />
            <div className="flex justify-between pt-2 border-t border-[#F8FAFC]">
              <div className="space-y-1">
                <div className="h-3 bg-[#F1F5F9] rounded animate-pulse w-16" />
                <div className="h-5 bg-[#EEF2FF] rounded animate-pulse w-20" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-3 bg-[#F1F5F9] rounded animate-pulse w-16" />
                <div className="h-4 bg-[#F0FDF4] rounded animate-pulse w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CONFIDENCE_COLOR = (score: number) =>
  score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#94A3B8';

function LiveFundRecommendations({ funds, aiSummary }: { funds: LiveSipFund[]; aiSummary: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-[#0F172A] font-semibold text-base">💼 Live SIP Recommendations</h4>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#6366F1] border border-[#C7D2FE]">🤖 AI Verified</span>
        </div>
        <p className="text-[#64748B] text-xs">Sourced live from Indian finance portals · Ranked by Qwen AI</p>
      </div>

      {aiSummary && (
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#374151] text-xs leading-relaxed">
          {aiSummary}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {funds.map((f, i) => (
          <div
            key={f.name + i}
            className="border border-[#E2E8F0] rounded-xl p-4 hover:border-[#6366F1]/40 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[#0F172A] font-semibold text-sm leading-tight">{f.name}</p>
                <p className="text-[#64748B] text-xs mt-0.5">{f.category} · {f.amc}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: CONFIDENCE_COLOR(f.ai_confidence) }}
                >
                  {f.ai_confidence}% match
                </span>
                {f.source && (
                  <span className="text-[#94A3B8] text-[9px]">{f.source}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F1F5F9]">
              <div>
                <p className="text-[#94A3B8] text-xs">Suggested SIP</p>
                <p className="text-[#6366F1] font-bold text-base">
                  {formatINR(f.suggested_sip)}<span className="text-xs font-normal text-[#94A3B8]">/mo</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#94A3B8] text-xs">3Y / 5Y Returns</p>
                <p className="text-[#10B981] font-semibold text-sm">
                  {f.returns_3y != null ? `${f.returns_3y}%` : '—'} / {f.returns_5y != null ? `${f.returns_5y}%` : '—'}
                </p>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8] text-xs">Allocation</span>
                <span className="text-[#374151] text-xs font-medium">{f.allocation_pct}%</span>
              </div>
              <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] transition-all"
                  style={{ width: `${f.allocation_pct}%` }}
                />
              </div>
              {f.expense_ratio != null && (
                <p className="text-[#94A3B8] text-xs">Expense ratio: {f.expense_ratio}%</p>
              )}
            </div>

            <p className="text-[#64748B] text-xs mt-2 leading-relaxed italic">{f.why}</p>
          </div>
        ))}
      </div>
      <p className="text-[#94A3B8] text-xs">
        ⚠️ Live data sourced from public portals. Not personalised SEBI-registered advice. Consult a registered advisor before investing.
      </p>
    </div>
  );
}

function LiveInsuranceRecommendations({ recs }: { recs: LiveInsuranceRec[] }) {
  if (recs.length === 0) return null;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
      <div>
        <h4 className="text-[#0F172A] font-semibold text-base">🛡️ Insurance Recommendations</h4>
        <p className="text-[#64748B] text-xs mt-0.5">Protect your FIRE journey against unexpected events</p>
      </div>
      <div className="space-y-3">
        {recs.map((r, i) => (
          <div
            key={r.type + i}
            className={`flex gap-4 p-4 rounded-xl border ${
              r.urgency === 'high' ? 'bg-[#FFF7ED] border-[#FED7AA]' : 'bg-[#F0FDF4] border-[#BBF7D0]'
            }`}
          >
            <span className="text-2xl">{r.type === 'Term Life Insurance' ? '🛡️' : r.type === 'Health Insurance' ? '🏥' : '💚'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-[#0F172A] font-semibold text-sm">{r.type}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.urgency === 'high' ? 'bg-[#F97316] text-white' : 'bg-[#10B981] text-white'
                }`}>{r.urgency === 'high' ? 'RECOMMENDED' : 'OPTIONAL'}</span>
              </div>
              <p className="text-[#374151] font-medium text-sm">{r.plan_name} <span className="text-[#94A3B8] font-normal text-xs">by {r.provider}</span></p>
              <p className="text-[#6366F1] font-semibold text-sm mb-1">{r.cover_recommended} · {r.approx_premium}</p>
              <p className="text-[#64748B] text-xs leading-relaxed">{r.why}</p>
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[#6366F1] text-xs font-medium hover:underline"
                >
                  View Plan →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function FirePlanner() {
  const { profile, user } = useAuth();
  const [hasSynced, setHasSynced] = useState(false);

  // Build initial values from profile
  const profileDefaults = useMemo<FireInputs>(() => {
    const age = ageFromDob(profile?.date_of_birth ?? null);
    return {
      current_age:      age,
      retire_age:       Math.max(age + 10, 50),
      annual_income:    profile?.annual_income    ?? 2_400_000,
      monthly_expense:  profile?.monthly_expense  ?? 80_000,
      current_savings:  profile?.current_savings  ?? 1_500_000,
      funds_value:      0, // Defaults to 0, sync will update it
      expected_return:  profile?.expected_return  ??
        (profile?.risk_profile === 'aggressive' ? 13
          : profile?.risk_profile === 'conservative' ? 9 : 11),
    };
  }, [profile]);

  const [form, setForm] = useState<FireInputs>(profileDefaults);

  // Sync with live portfolio total
  useEffect(() => {
    async function syncPortfolioTotal() {
      if (!user || hasSynced) return;
      try {
        const { data } = await supabase
          .from('portfolio_funds')
          .select('current_value')
          .eq('user_id', user.id);
        
        if (data && data.length > 0) {
          const totalValue = data.reduce((sum, f) => sum + (f.current_value || 0), 0);
          setForm(prev => ({ ...prev, funds_value: totalValue }));
          setHasSynced(true);
        }
      } catch (err) {
        console.error("Portfolio sync error:", err);
      }
    }
    syncPortfolioTotal();
  }, [user, hasSynced]);

  const [result, setResult] = useState<FireResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [whatIfAge, setWhatIfAge] = useState('');
  const [whatIfResult, setWhatIfResult] = useState<Partial<FireResponse> | null>(null);

  const set = (k: keyof FireInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: Number(e.target.value) }));
  };

  const handlePlan = () => {
    setLoading(true);
    setTimeout(() => {
      setResult(calculateFIRE(form));
      setLoading(false);
      setWhatIfResult(null);
    }, 700);
  };

  const handleWhatIf = () => {
    const age = parseInt(whatIfAge);
    if (!age || age <= form.current_age || age > 80) return;
    const updated = calculateFIRE({ ...form, retire_age: age });
    setWhatIfResult({
      corpus_needed:   updated.corpus_needed,
      sip_per_month:   updated.sip_per_month,
      years_to_retire: updated.years_to_retire,
      feasibility:     updated.feasibility,
    });
  };

  // Derived recs — static fallback only (used when live pipeline fails)
  const staticFundRecs = useMemo<FundRec[]>(() => {
    if (!result) return [];
    return buildFundRecs(
      result.sip_per_month,
      profile?.risk_profile ?? null,
      form.expected_return,
      result.years_to_retire,
    );
  }, [result, profile?.risk_profile, form.expected_return]);

  const staticInsuranceRecs = useMemo<InsuranceRec[]>(() => {
    if (!result) return [];
    return buildInsuranceRecs(
      profile?.has_term_insurance ?? null,
      profile?.has_health_insurance ?? null,
      form.annual_income,
      form.current_age,
    );
  }, [result, profile?.has_term_insurance, profile?.has_health_insurance, form.annual_income, form.current_age]);

  // Derive risk from expected return slider
  const riskProfile = (form.expected_return >= 13 ? 'aggressive'
    : form.expected_return >= 10 ? 'moderate'
    : 'conservative') as 'aggressive' | 'moderate' | 'conservative';

  // Live recommendations hook — triggers after user clicks "Plan my retirement"
  const liveRecs = useFireRecommendations({
    userId: profile?.user_id ?? null,
    riskProfile,
    sipAmount: result?.sip_per_month ?? 10000,
    annualIncome: form.annual_income,
    age: form.current_age,
    hasTermInsurance: profile?.has_term_insurance ?? false,
    hasHealthInsurance: profile?.has_health_insurance ?? false,
    enabled: !!result, // only trigger once FIRE result is ready
  });

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-colors';
  const labelClass = 'block text-[#374151] text-sm font-medium mb-1.5';

  const feasibilityVariant =
    result?.feasibility === 'on track'
      ? 'success'
      : result?.feasibility === 'stretch goal'
      ? 'warning'
      : 'danger';

  const feasibilityLabel =
    result?.feasibility === 'on track'
      ? 'On Track 🎯'
      : result?.feasibility === 'stretch goal'
      ? 'Stretch Goal ⚡'
      : 'Needs Revision ⚠️';

  const profileFilled = !!profile;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[#0F172A] font-bold text-2xl">FIRE Planner</h2>
          <p className="text-[#64748B] text-sm mt-1">Financial Independence, Retire Early — plan your path</p>
        </div>
        {profileFilled && (
          <span className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] inline-block" />
            Pre-filled from your profile
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT — Inputs */}
        <div className="lg:w-[380px] flex-shrink-0">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 sticky top-6">
            <h3 className="text-[#0F172A] font-semibold text-base">Your retirement inputs</h3>

            <div>
              <label className={labelClass}>Current Age</label>
              <input
                type="number"
                className={inputClass}
                value={form.current_age}
                min={18}
                max={60}
                onChange={set('current_age')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelClass} mb-0`}>Target Retire Age</label>
                <span className="bg-[#6366F1] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  Age {form.retire_age}
                </span>
              </div>
              <input
                type="range"
                min={Math.max(form.current_age + 5, 40)}
                max={70}
                value={form.retire_age}
                onChange={set('retire_age')}
                className="w-full accent-[#6366F1]"
              />
              <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
                <span>Age {Math.max(form.current_age + 5, 40)}</span>
                <span className="text-[#6366F1] font-medium">{form.retire_age - form.current_age} yrs to retire</span>
                <span>Age 70</span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Annual Income (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <input type="number" className={`${inputClass} pl-7`} value={form.annual_income} onChange={set('annual_income')} />
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">{formatCr(form.annual_income)} per year · {formatINR(Math.round(form.annual_income / 12))}/mo</p>
            </div>

            <div>
              <label className={labelClass}>Monthly Expenses (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <input type="number" className={`${inputClass} pl-7`} value={form.monthly_expense} onChange={set('monthly_expense')} />
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Savings rate: {form.annual_income > 0 ? (((form.annual_income / 12 - form.monthly_expense) / (form.annual_income / 12)) * 100).toFixed(0) : 0}% of monthly income
              </p>
            </div>

            <div>
              <label className={labelClass}>Liquid Savings / FDs (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <input type="number" className={`${inputClass} pl-7`} value={form.current_savings} onChange={set('current_savings')} />
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">Cash, FDs, and other low-risk liquid assets.</p>
            </div>

            <div>
              <label className={labelClass}>Mutual Funds & Stocks (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <input type="number" className={`${inputClass} pl-7`} value={form.funds_value} onChange={set('funds_value')} />
              </div>
              <p className="text-xs text-[#6366F1] mt-1 font-medium">✨ Pre-filled from your live Portfolio Sync</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`${labelClass} mb-0`}>Expected Return (p.a.)</label>
                <span className="bg-[#6366F1] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {form.expected_return}%
                </span>
              </div>
              <input
                type="range"
                min={6}
                max={16}
                step={0.5}
                value={form.expected_return}
                onChange={set('expected_return')}
                className="w-full accent-[#6366F1]"
              />
              <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
                <span>6% (Conservative)</span>
                <span>16% (Aggressive)</span>
              </div>
            </div>

            <button
              onClick={handlePlan}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Calculating…' : 'Plan my retirement →'}
            </button>

            {!profileFilled && (
              <p className="text-[#94A3B8] text-xs text-center">
                💡 Complete your profile in chat to auto-fill these fields
              </p>
            )}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div className="flex-1 space-y-5">
          {loading && (
            <div className="space-y-4">
              <div className="flex gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                    <div className="h-3 bg-[#F1F5F9] rounded animate-pulse w-2/3" />
                    <div className="h-7 bg-[#F1F5F9] rounded animate-pulse w-1/2" />
                  </div>
                ))}
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 h-56 animate-pulse" />
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 h-32 animate-pulse" />
            </div>
          )}

          {result && !loading && (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <MetricCard label="Corpus Needed" value={formatCr(result.corpus_needed)} variant="default" />
                <MetricCard label="Monthly SIP" value={formatINR(result.sip_per_month)} variant="positive" />
                <MetricCard label="Years to Retire" value={`${result.years_to_retire} yrs`} variant="default" />
              </div>

              {/* Feasibility */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#64748B] text-sm">Feasibility:</span>
                <StatusPill variant={feasibilityVariant} label={feasibilityLabel} />
                <span className="text-[#94A3B8] text-xs">
                  · SIP is {form.annual_income > 0
                    ? `${((result.sip_per_month * 12 / form.annual_income) * 100).toFixed(1)}% of your annual income`
                    : '—'}
                </span>
              </div>

              {/* Chart */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h4 className="text-[#0F172A] font-semibold text-sm mb-4">Corpus Growth Projection</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={result.chart_data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <XAxis
                      dataKey="age"
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={false}
                      label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94A3B8' }}
                    />
                    <YAxis
                      tickFormatter={formatChartVal}
                      tick={{ fontSize: 10, fill: '#94A3B8' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#64748B', paddingTop: 8 }}
                      iconType="circle"
                    />
                    <Line
                      type="monotone"
                      dataKey="projected"
                      name="Your corpus"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="required"
                      name="Required corpus"
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Analysis Breakdown */}
              <AnalysisBreakdown form={form} result={result} />

              {/* What-If */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <h4 className="text-[#0F172A] font-semibold text-sm mb-3">
                  What if I retire at a different age?
                </h4>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[#64748B] text-xs mb-1.5">Retire at age</label>
                    <input
                      type="number"
                      value={whatIfAge}
                      onChange={(e) => setWhatIfAge(e.target.value)}
                      placeholder="e.g. 55"
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>
                  <button
                    onClick={handleWhatIf}
                    className="px-4 py-2.5 rounded-lg bg-[#EEF2FF] text-[#6366F1] text-sm font-medium hover:bg-[#E0E7FF] transition-colors"
                  >
                    Recalculate
                  </button>
                </div>
                {whatIfResult && (
                  <div className="mt-4 p-3 bg-[#F8FAFC] rounded-xl flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-[#64748B]">New Corpus: </span>
                      <span className="font-semibold text-[#0F172A]">{formatCr(whatIfResult.corpus_needed!)}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">SIP Needed: </span>
                      <span className="font-semibold text-[#6366F1]">{formatINR(whatIfResult.sip_per_month!)}/mo</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Years: </span>
                      <span className="font-semibold text-[#0F172A]">{whatIfResult.years_to_retire} yrs</span>
                    </div>
                    <StatusPill
                      variant={
                        whatIfResult.feasibility === 'on track'
                          ? 'success'
                          : whatIfResult.feasibility === 'stretch goal'
                          ? 'warning'
                          : 'danger'
                      }
                      label={
                        whatIfResult.feasibility === 'on track'
                          ? 'On Track'
                          : whatIfResult.feasibility === 'stretch goal'
                          ? 'Stretch Goal'
                          : 'Needs Revision'
                      }
                    />
                  </div>
                )}
              </div>

              {/* AI reasoning */}
              <AIExplanationCard text={result.reasoning} />

              {/* ── Personalised Recommendations ── */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-[#94A3B8] text-xs font-medium uppercase tracking-widest">Personalised Recommendations</p>
                  {liveRecs.status === 'ready' && (
                    <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-medium">
                      ● Live Data
                      {liveRecs.attemptsRemaining !== null && (
                        <span className="text-[#15803D] opacity-80 border-l border-[#BBF7D0] pl-1.5">
                          {liveRecs.attemptsRemaining} left today
                        </span>
                      )}
                    </span>
                  )}
                  {liveRecs.status === 'rate_limited' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-medium">● Limit Reached</span>
                  )}
                  {liveRecs.status === 'loading' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#6366F1] font-medium animate-pulse">● Fetching…</span>
                  )}
                </div>
                <div className="space-y-5">
                  {/* Live data ready */}
                  {liveRecs.status === 'ready' && liveRecs.data && (
                    <>
                      <LiveFundRecommendations
                        funds={liveRecs.data.sip_funds}
                        aiSummary={liveRecs.data.ai_summary}
                      />
                      <LiveInsuranceRecommendations recs={liveRecs.data.insurance} />
                    </>
                  )}
                  {/* Live data loading — show shimmer */}
                  {liveRecs.status === 'loading' && <RecsShimmer />}
                  {/* Error, idle, or rate_limited — fall back to static */}
                  {(liveRecs.status === 'error' || liveRecs.status === 'idle' || liveRecs.status === 'rate_limited') && (
                    <>
                      {liveRecs.status === 'rate_limited' && (
                        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm">
                          <p className="font-semibold text-[#B91C1C]">Daily Live Analysis Limit Reached</p>
                          <p className="text-[#DC2626] mt-1">You have exhausted your daily quota of live AI analysis. We are displaying algorithm-based recommendations instead. Your quota resets tomorrow.</p>
                        </div>
                      )}
                      <FundRecommendations funds={staticFundRecs} />
                      <InsuranceRecommendations recs={staticInsuranceRecs} />
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-64 bg-white border border-[#E2E8F0] rounded-xl text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-3">
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-[#64748B] text-sm">Fill in your retirement inputs and click <strong>Plan my retirement</strong> to see your FIRE projection, analysis breakdown, and fund recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
