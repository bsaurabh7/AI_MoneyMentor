import { useState } from 'react';
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

const INITIAL: FireInputs = {
  current_age: 30,
  retire_age: 50,
  annual_income: 2400000,
  monthly_expense: 80000,
  current_savings: 1500000,
  expected_return: 12,
};

function formatChartVal(v: number) {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  return `₹${(v / 1000).toFixed(0)}K`;
}

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

export function FirePlanner() {
  const [form, setForm] = useState<FireInputs>(INITIAL);
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
      corpus_needed: updated.corpus_needed,
      sip_per_month: updated.sip_per_month,
      years_to_retire: updated.years_to_retire,
      feasibility: updated.feasibility,
    });
  };

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
      ? 'On Track'
      : result?.feasibility === 'stretch goal'
      ? 'Stretch Goal'
      : 'Needs Revision';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h2 className="text-[#0F172A] font-bold text-2xl">FIRE Planner</h2>
        <p className="text-[#64748B] text-sm mt-1">Financial Independence, Retire Early — plan your path</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT — Inputs */}
        <div className="lg:w-[380px] flex-shrink-0">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4">
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
                min={40}
                max={65}
                value={form.retire_age}
                onChange={set('retire_age')}
                className="w-full accent-[#6366F1]"
              />
              <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
                <span>40</span>
                <span>65</span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Annual Income (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <input type="number" className={`${inputClass} pl-7`} value={form.annual_income} onChange={set('annual_income')} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Monthly Expenses (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <input type="number" className={`${inputClass} pl-7`} value={form.monthly_expense} onChange={set('monthly_expense')} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Current Savings (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
                <input type="number" className={`${inputClass} pl-7`} value={form.current_savings} onChange={set('current_savings')} />
              </div>
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
                min={8}
                max={15}
                value={form.expected_return}
                onChange={set('expected_return')}
                className="w-full accent-[#6366F1]"
              />
              <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
                <span>8%</span>
                <span>15%</span>
              </div>
            </div>

            <button
              onClick={handlePlan}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {loading ? 'Planning...' : 'Plan my retirement →'}
            </button>
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
            </div>
          )}

          {result && !loading && (
            <>
              {/* Metric Cards */}
              <div className="flex gap-3">
                <MetricCard label="Corpus Needed" value={formatCr(result.corpus_needed)} variant="default" />
                <MetricCard label="SIP Per Month" value={formatINR(result.sip_per_month)} variant="positive" />
                <MetricCard label="Years to Retire" value={`${result.years_to_retire} yrs`} variant="default" />
              </div>

              {/* Feasibility */}
              <div className="flex items-center gap-2">
                <span className="text-[#64748B] text-sm">Feasibility:</span>
                <StatusPill variant={feasibilityVariant} label={feasibilityLabel} />
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

              {/* AI Card */}
              <AIExplanationCard text={result.reasoning} />
            </>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-64 bg-white border border-[#E2E8F0] rounded-xl text-center px-6">
              <div className="w-12 h-12 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-3">
                <span className="text-2xl">🔥</span>
              </div>
              <p className="text-[#64748B] text-sm">Fill in your retirement inputs and click <strong>Plan my retirement</strong> to see your FIRE projection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
