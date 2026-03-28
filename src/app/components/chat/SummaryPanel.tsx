import { CheckCircle, Circle } from 'lucide-react';
import { type TaxResponse, type FireResponse, formatINR, formatCr } from '../../utils/finCalc';
import { type CollectedData, getSalary, getHRA, get80C, getNPS, getCurrentAge } from '../../hooks/useCollectedData';

interface Props {
  collected: CollectedData;
  taxResult: TaxResponse | null;
  fireResult: FireResponse | null;
  progress: number;
  onStartFire?: () => void;
}

interface PillDef {
  label: string;
  getValue: (c: CollectedData) => number | string | undefined;
  format: (v: any) => string;
}

const PILLS: PillDef[] = [
  { label: 'Salary',     getValue: (c) => c.income?.base_salary,           format: (v) => `₹${(v / 100000).toFixed(1)}L` },
  { label: 'HRA',        getValue: (c) => c.income?.hra_received,           format: (v) => `₹${(v / 100000).toFixed(1)}L` },
  { label: '80C',        getValue: (c) => c.assets?.deduction_80c,          format: (v) => `₹${(v / 100000).toFixed(1)}L` },
  { label: 'NPS',        getValue: (c) => c.assets?.nps_80ccd,              format: (v) => `₹${(v / 1000).toFixed(0)}K` },
  { label: 'Age',        getValue: (c) => c.demographics?.age,              format: (v) => `${v} yrs` },
  { label: 'City',       getValue: (c) => c.demographics?.city_type,        format: (v) => v },
  { label: 'Expenses',   getValue: (c) => c.expenses?.fixed_monthly,        format: (v) => `₹${(v / 1000).toFixed(0)}K/mo` },
  { label: 'Rent',       getValue: (c) => c.expenses?.rent_paid_monthly,    format: (v) => v === 0 ? 'Own home' : `₹${(v / 1000).toFixed(0)}K/mo` },
  { label: 'Insurance',  getValue: (c) => c.expenses?.health_insurance_premium, format: (v) => `₹${(v / 1000).toFixed(0)}K/yr` },
  { label: 'Home Loan',  getValue: (c) => c.liabilities?.home_loan_emi,    format: (v) => v === 0 ? 'None' : `₹${(v / 1000).toFixed(0)}K/mo` },
  { label: 'CC Debt',    getValue: (c) => c.liabilities?.credit_card_debt,  format: (v) => v === 0 ? 'None' : formatINR(v) },
  { label: 'EM Fund',    getValue: (c) => c.assets?.emergency_fund,         format: (v) => formatCr(v) },
];

export function SummaryPanel({ collected, taxResult, fireResult, progress, onStartFire }: Props) {
  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden relative">
      {/* Progress bar — right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#E2E8F0]">
        <div
          className="w-full bg-[#6366F1] transition-all duration-700 rounded-b"
          style={{ height: `${progress}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6 pr-8 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-[#0F172A] font-bold text-lg">Your Financial Summary</h2>
          <p className="text-[#64748B] text-xs mt-0.5">Updates live as we chat</p>
        </div>

        {/* Data collection progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#374151] text-sm font-medium">Data collected</span>
            <span className="text-[#6366F1] text-sm font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#6366F1] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress < 100 && (
            <div className="flex items-center justify-between bg-[#EEF2FF] border border-[#C7D2FE] px-3 py-2 rounded-lg">
              <span className="text-xs text-[#4338CA] font-medium leading-tight max-w-[160px]">
                Please Complete your profile for better results.
              </span>
              <button 
                onClick={() => window.location.href = '/'} 
                className="text-[10px] uppercase tracking-wider bg-white text-[#4F46E5] px-2.5 py-1.5 rounded font-bold hover:bg-[#E0E7FF] hover:border-[#6366F1] transition-all border border-[#C7D2FE] shadow-sm ml-2 shrink-0"
              >
                Let's Start
              </button>
            </div>
          )}
        </div>

        {/* Profile pills */}
        <div>
          <h3 className="text-[#64748B] text-xs font-semibold uppercase tracking-wider mb-2.5">
            Profile so far
          </h3>
          <div className="flex flex-wrap gap-2">
            {PILLS.map(({ label, getValue, format }) => {
              const val = getValue(collected);
              const confirmed = val !== undefined && val !== null;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                    confirmed
                      ? 'bg-[#D1FAE5] border-[#6EE7B7] text-[#065F46]'
                      : 'bg-white border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  {confirmed ? (
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 flex-shrink-0" />
                  )}
                  {confirmed ? `${label}: ${format(val)}` : `${label}: ?`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tax Result */}
        {taxResult ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
              <h3 className="text-[#0F172A] font-semibold text-sm">Tax Analysis Complete ✓</h3>
              <span className="text-[#10B981] text-xs font-medium">
                Save {formatINR(taxResult.savings)}
              </span>
            </div>
            <div className="p-4">
              {/* Side by side mini cards */}
              <div className="flex gap-3 mb-4">
                {[
                  { label: 'Old Regime', data: taxResult.old_regime, isWinner: taxResult.winner === 'old' },
                  { label: 'New Regime', data: taxResult.new_regime, isWinner: taxResult.winner === 'new' },
                ].map(({ label, data, isWinner }) => (
                  <div
                    key={label}
                    className="flex-1 rounded-xl p-3"
                    style={
                      isWinner
                        ? { background: '#F0FDF4', border: '2px solid #10B981' }
                        : { background: '#F8FAFC', border: '1px solid #E2E8F0' }
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[#374151] text-xs font-medium">{label}</p>
                      {isWinner && (
                        <span className="text-[10px] bg-[#10B981] text-white px-1.5 py-0.5 rounded-full font-semibold">
                          Best ✓
                        </span>
                      )}
                    </div>
                    <p className={`font-bold text-base ${isWinner ? 'text-[#10B981]' : 'text-[#374151]'}`}>
                      {formatINR(data.total_tax)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detailed comparison table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    <th className="text-left text-[#94A3B8] py-1.5 font-medium">Item</th>
                    <th className="text-right text-[#6366F1] py-1.5 font-medium">Old</th>
                    <th className="text-right text-[#94A3B8] py-1.5 font-medium">New</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {[
                    ['Gross Income', formatINR(getSalary(collected)), formatINR(getSalary(collected))],
                    ['Deductions', formatINR(taxResult.old_regime.deductions), formatINR(taxResult.new_regime.deductions)],
                    ['Taxable Income', formatINR(taxResult.old_regime.taxable_income), formatINR(taxResult.new_regime.taxable_income)],
                    ['Tax', formatINR(taxResult.old_regime.tax_before_cess), formatINR(taxResult.new_regime.tax_before_cess)],
                    ['Cess (4%)', formatINR(taxResult.old_regime.cess), formatINR(taxResult.new_regime.cess)],
                    ['Final Tax', formatINR(taxResult.old_regime.total_tax), formatINR(taxResult.new_regime.total_tax)],
                  ].map(([item, old, nw]) => (
                    <tr key={item}>
                      <td className="py-1.5 text-[#64748B]">{item}</td>
                      <td
                        className={`py-1.5 text-right font-medium ${taxResult.winner === 'old' ? 'text-[#10B981]' : 'text-[#374151]'}`}
                        style={taxResult.winner === 'old' && item === 'Final Tax' ? { background: '#F0FDF4', borderRadius: 4 } : {}}
                      >
                        {old}
                      </td>
                      <td
                        className={`py-1.5 text-right font-medium ${taxResult.winner === 'new' ? 'text-[#10B981]' : 'text-[#374151]'}`}
                      >
                        {nw}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
            <p className="text-[#374151] font-medium text-sm mb-1">Tax Analysis</p>
            <p className="text-[#94A3B8] text-xs">Waiting for your salary & deduction info...</p>
          </div>
        )}

        {/* FIRE Result or Placeholder */}
        {fireResult ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#6366F1]">
              <p className="text-white font-semibold text-sm">FIRE Plan Summary 🔥</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Corpus Needed', value: formatCr(fireResult.corpus_needed) },
                  { label: 'SIP/month', value: formatINR(fireResult.sip_per_month) },
                  { label: 'Years', value: `${fireResult.years_to_retire} yrs` },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-[#F8FAFC] rounded-lg p-2.5">
                    <p className="text-[#94A3B8] text-[10px] mb-0.5">{label}</p>
                    <p className="text-[#0F172A] font-bold text-sm">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Feasibility:</span>
                <span
                  className={`font-semibold ${
                    fireResult.feasibility === 'on track'
                      ? 'text-[#10B981]'
                      : fireResult.feasibility === 'stretch goal'
                      ? 'text-[#F59E0B]'
                      : 'text-[#EF4444]'
                  }`}
                >
                  {fireResult.feasibility === 'on track' ? '✓ On Track' : fireResult.feasibility === 'stretch goal' ? '⚡ Stretch Goal' : '⚠ Needs Revision'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-[#E2E8F0] rounded-xl p-5 text-center">
            <p className="text-[#374151] font-medium text-sm mb-1">FIRE Retirement Plan</p>
            <p className="text-[#94A3B8] text-xs mb-4">
              FIRE plan will appear here once you share your age and expenses
            </p>
            {taxResult && (
              <button
                onClick={onStartFire}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EEF2FF] text-[#6366F1] text-xs font-semibold hover:bg-[#E0E7FF] transition-colors"
              >
                Start FIRE planning ↓
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}