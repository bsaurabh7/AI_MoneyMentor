import { Bot } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { type FireResponse, formatINR, formatCr } from '../../utils/finCalc';

interface Props {
  data: FireResponse;
  retireAge: number;
}

const FEASIBILITY = {
  'on track': { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', label: 'On Track — Great! 🎉' },
  'stretch goal': { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', label: 'Stretch Goal — Achievable with discipline ⚡' },
  'needs revision': { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', label: 'Needs Revision — Let\'s adjust 🔧' },
};

function fmtChart(v: number) {
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `${(v / 100_000).toFixed(0)}L`;
  return `${(v / 1000).toFixed(0)}K`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-2 text-xs shadow">
      <p className="text-[#64748B] mb-1">Age {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: ₹{fmtChart(p.value)}
        </p>
      ))}
    </div>
  );
};

export function ChatFireCard({ data, retireAge }: Props) {
  const { corpus_needed, sip_per_month, years_to_retire, feasibility, chart_data } = data;
  const feas = FEASIBILITY[feasibility] ?? FEASIBILITY['stretch goal'];

  const SIP_ALLOC = [
    { label: 'Large Cap', pct: '50%', color: '#6366F1' },
    { label: 'Mid Cap', pct: '30%', color: '#10B981' },
    { label: 'Debt', pct: '20%', color: '#F59E0B' },
  ];

  return (
    <div className="flex items-start gap-2.5 w-full">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>

      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#6366F1]">
          <p className="text-white font-bold text-sm">FIRE Plan — Retire at {retireAge} 🔥</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Metric row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Corpus Needed', value: formatCr(corpus_needed) },
              { label: 'SIP/month', value: formatINR(sip_per_month) },
              { label: 'Years left', value: `${years_to_retire} yrs` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-[#94A3B8] text-[10px] leading-tight mb-0.5">{label}</p>
                <p className="text-[#0F172A] font-bold text-sm leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Feasibility */}
          <div
            className="text-center py-1.5 px-3 rounded-full border text-xs font-semibold"
            style={{ background: feas.bg, color: feas.text, borderColor: feas.border }}
          >
            {feas.label}
          </div>

          {/* Mini chart */}
          <div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chart_data} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <XAxis dataKey="age" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="projected" name="Your path" stroke="#6366F1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="required" name="Target" stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-1">
              <span className="flex items-center gap-1 text-[10px] text-[#6366F1]">
                <span className="w-3 h-0.5 bg-[#6366F1] inline-block" /> Your path
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#EF4444]">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-[#EF4444] inline-block" /> Target
              </span>
            </div>
          </div>

          {/* SIP allocation */}
          <div>
            <p className="text-[#64748B] text-xs font-medium mb-2">Recommended SIP allocation:</p>
            <div className="space-y-1.5">
              {SIP_ALLOC.map(({ label, pct, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[#374151] text-xs">{label}</span>
                  </div>
                  <span className="text-[#374151] text-xs font-medium">{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
