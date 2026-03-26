import { CheckCircle, Bot } from 'lucide-react';
import { type TaxResponse, formatINR } from '../../utils/finCalc';

interface Props {
  data: TaxResponse;
}

export function ChatTaxCard({ data }: Props) {
  const { old_regime, new_regime, winner, savings } = data;
  const winnerIsOld = winner === 'old';

  return (
    <div className="flex items-start gap-2.5 w-full">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>

      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#F1F5F9]">
          <p className="text-[#6366F1] font-bold text-sm">Tax Regime Analysis ✓</p>
          <p className="text-[#94A3B8] text-xs mt-0.5">Based on your inputs</p>
        </div>

        {/* Regime comparison */}
        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            {/* Old Regime */}
            <div
              className={`flex-1 rounded-xl p-3 ${winnerIsOld ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC]'}`}
              style={winnerIsOld ? { border: '2px solid #10B981' } : { border: '1px solid #E2E8F0' }}
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-[#374151] text-xs font-medium">Old Regime</p>
                {winnerIsOld && (
                  <span className="bg-[#10B981] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                    Best ✓
                  </span>
                )}
              </div>
              <p className={`text-lg font-bold ${winnerIsOld ? 'text-[#10B981]' : 'text-[#374151]'}`}>
                {formatINR(old_regime.total_tax)}
              </p>
              <p className="text-[#94A3B8] text-[10px] mt-0.5">Annual tax</p>
            </div>

            {/* New Regime */}
            <div
              className={`flex-1 rounded-xl p-3 ${!winnerIsOld ? 'bg-[#F0FDF4]' : 'bg-[#F8FAFC]'}`}
              style={!winnerIsOld ? { border: '2px solid #10B981' } : { border: '1px solid #E2E8F0' }}
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-[#374151] text-xs font-medium">New Regime</p>
                {!winnerIsOld && (
                  <span className="bg-[#10B981] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                    Best ✓
                  </span>
                )}
              </div>
              <p className={`text-lg font-bold ${!winnerIsOld ? 'text-[#10B981]' : 'text-[#374151]'}`}>
                {formatINR(new_regime.total_tax)}
              </p>
              <p className="text-[#94A3B8] text-[10px] mt-0.5">Annual tax</p>
            </div>
          </div>

          {/* Savings strip */}
          <div className="flex items-center gap-2 bg-[#D1FAE5] rounded-xl px-3 py-2">
            <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
            <p className="text-[#065F46] text-xs font-semibold">
              You save {formatINR(savings)} with {winnerIsOld ? 'Old' : 'New'} Regime
            </p>
          </div>

          {/* Quick breakdown */}
          <div className="space-y-1.5">
            {[
              ['Taxable Income', formatINR(winnerIsOld ? old_regime.taxable_income : new_regime.taxable_income)],
              ['Total Deductions', formatINR(winnerIsOld ? old_regime.deductions : new_regime.deductions)],
              ['Tax + Cess', formatINR(winnerIsOld ? old_regime.total_tax : new_regime.total_tax)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-[#94A3B8]">{k}</span>
                <span className="text-[#374151] font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
