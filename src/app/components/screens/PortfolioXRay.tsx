import { useState } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { analyzePortfolio, formatINR, formatCr, type Fund, type PortfolioResponse } from '../../utils/finCalc';
import { AIExplanationCard } from '../shared/AIExplanationCard';
import { MetricCard } from '../shared/MetricCard';
import { StatusPill } from '../shared/StatusPill';

const CATEGORIES = [
  { value: 'large_cap', label: 'Large Cap' },
  { value: 'flexi_cap', label: 'Flexi Cap' },
  { value: 'mid_cap', label: 'Mid Cap' },
  { value: 'elss', label: 'ELSS' },
  { value: 'debt', label: 'Debt' },
  { value: 'international', label: 'International' },
];

const CATEGORY_COLORS: Record<string, string> = {
  large_cap: '#6366F1',
  flexi_cap: '#F59E0B',
  mid_cap: '#10B981',
  elss: '#3B82F6',
  debt: '#8B5CF6',
  international: '#EC4899',
};

const INITIAL_FUNDS: Fund[] = [
  { id: '1', name: 'Mirae Asset Large Cap', amount_invested: 100000, current_value: 142000, category: 'large_cap' },
  { id: '2', name: 'Parag Parikh Flexi Cap', amount_invested: 80000, current_value: 115000, category: 'flexi_cap' },
  { id: '3', name: 'Axis Midcap Fund', amount_invested: 60000, current_value: 78000, category: 'mid_cap' },
];

let nextId = 4;

export function PortfolioXRay() {
  const [funds, setFunds] = useState<Fund[]>(INITIAL_FUNDS);
  const [result, setResult] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateFund = (id: string, k: keyof Fund) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFunds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value } : f))
    );
  };

  const addFund = () => {
    setFunds((prev) => [
      ...prev,
      { id: String(nextId++), name: '', amount_invested: 0, current_value: 0, category: 'large_cap' },
    ]);
  };

  const removeFund = (id: string) => setFunds((prev) => prev.filter((f) => f.id !== id));

  const handleAnalyze = () => {
    const valid = funds.filter((f) => f.name && f.amount_invested > 0 && f.current_value > 0);
    if (valid.length < 2) {
      setError('Please enter at least 2 valid funds with name, invested amount, and current value.');
      return;
    }
    setError('');
    setLoading(true);
    setTimeout(() => {
      setResult(analyzePortfolio(valid));
      setLoading(false);
    }, 700);
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] text-sm focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/20';

  const cellColor = (pct: number) =>
    pct < 20 ? '#DCFCE7' : pct < 40 ? '#FEF9C3' : '#FEE2E2';
  const cellTextColor = (pct: number) =>
    pct < 20 ? '#065F46' : pct < 40 ? '#92400E' : '#991B1B';

  const xirrVariant = result
    ? result.xirr > result.benchmark_return
      ? 'positive'
      : 'negative'
    : 'default';
  const vsNifty = result ? result.xirr - result.benchmark_return : 0;

  // Build fund names array for overlap matrix
  const fundNames = result
    ? funds.filter((f) => f.name && f.amount_invested > 0 && f.current_value > 0).map((f) => f.name)
    : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h2 className="text-[#0F172A] font-bold text-2xl">MF Portfolio X-Ray</h2>
        <p className="text-[#64748B] text-sm mt-1">Analyze overlap, returns, and rebalancing needs</p>
      </div>

      {/* Fund Entry Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-[#0F172A] font-semibold text-base">Add your mutual funds</h3>
          <p className="text-[#64748B] text-xs mt-0.5">No file upload needed — enter manually</p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Fund Name', 'Amount Invested (₹)', 'Current Value (₹)', 'Category', ''].map((h) => (
                  <th key={h} className="text-left text-[#64748B] text-xs font-medium py-2 pr-3 last:pr-0 last:w-8">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {funds.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      className={inputClass}
                      value={f.name}
                      onChange={updateFund(f.id, 'name')}
                      placeholder="e.g. Mirae Asset Large Cap"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      className={inputClass}
                      value={f.amount_invested || ''}
                      onChange={updateFund(f.id, 'amount_invested')}
                      placeholder="100000"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      className={inputClass}
                      value={f.current_value || ''}
                      onChange={updateFund(f.id, 'current_value')}
                      placeholder="142000"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select className={inputClass} value={f.category} onChange={updateFund(f.id, 'category')}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeFund(f.id)}
                      disabled={funds.length <= 1}
                      className="text-[#94A3B8] hover:text-[#EF4444] disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-3">
          {funds.map((f, i) => (
            <div key={f.id} className="bg-[#F8FAFC] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B] text-xs font-medium">Fund {i + 1}</span>
                <button onClick={() => removeFund(f.id)} disabled={funds.length <= 1} className="text-[#94A3B8] hover:text-[#EF4444] disabled:opacity-30">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input type="text" className={inputClass} value={f.name} onChange={updateFund(f.id, 'name')} placeholder="Fund name" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className={inputClass} value={f.amount_invested || ''} onChange={updateFund(f.id, 'amount_invested')} placeholder="Invested ₹" />
                <input type="number" className={inputClass} value={f.current_value || ''} onChange={updateFund(f.id, 'current_value')} placeholder="Current ₹" />
              </div>
              <select className={inputClass} value={f.category} onChange={updateFund(f.id, 'category')}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        {error && <p className="text-[#EF4444] text-sm mt-2">{error}</p>}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 gap-3">
          <button
            onClick={addFund}
            className="flex items-center gap-1.5 text-[#6366F1] text-sm font-medium hover:text-[#4F46E5] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add another fund
          </button>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? 'Analyzing...' : 'Analyze Portfolio →'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                <div className="h-3 bg-[#F1F5F9] rounded animate-pulse w-2/3" />
                <div className="h-7 bg-[#F1F5F9] rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Portfolio Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Portfolio XIRR"
              value={`${result.xirr.toFixed(1)}%`}
              variant={xirrVariant}
            />
            <MetricCard
              label="Avg Expense Ratio"
              value={`${result.avg_expense_ratio}%`}
              variant={result.avg_expense_ratio < 1 ? 'positive' : result.avg_expense_ratio <= 1.5 ? 'default' : 'negative'}
            />
            <MetricCard
              label="vs Nifty 50"
              value={`${vsNifty >= 0 ? '+' : ''}${vsNifty.toFixed(1)}%`}
              variant={vsNifty >= 0 ? 'positive' : 'negative'}
            />
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1">
              <p className="text-[#64748B] text-xs mb-2">Overlap</p>
              <StatusPill
                variant={result.overlap_severity === 'Low' ? 'success' : result.overlap_severity === 'Medium' ? 'warning' : 'danger'}
                label={result.overlap_severity}
              />
            </div>
          </div>

          {/* Total Summary */}
          <div className="flex flex-wrap gap-4 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm">
            <div>
              <span className="text-[#64748B]">Total Invested: </span>
              <span className="font-semibold text-[#0F172A]">{formatINR(result.total_invested)}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Current Value: </span>
              <span className="font-semibold text-[#10B981]">{formatINR(result.total_current)}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Total Gain: </span>
              <span className={`font-semibold ${result.total_current >= result.total_invested ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {result.total_current >= result.total_invested ? '+' : ''}{formatINR(result.total_current - result.total_invested)}
              </span>
            </div>
          </div>

          {/* Overlap + Allocation */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Overlap Matrix */}
            <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h3 className="text-[#0F172A] font-semibold text-base mb-4">Fund Overlap Heatmap</h3>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse w-full min-w-[300px]">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-[#94A3B8] text-left text-xs w-24"></th>
                      {fundNames.map((name) => (
                        <th key={name} className="p-1.5 text-[#64748B] text-center font-medium">
                          <div className="w-20 truncate" title={name}>{name.substring(0, 12)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fundNames.map((rowFund) => (
                      <tr key={rowFund}>
                        <td className="p-1.5 text-[#64748B] font-medium text-xs">
                          <div className="w-24 truncate" title={rowFund}>{rowFund.substring(0, 14)}</div>
                        </td>
                        {fundNames.map((colFund) => {
                          if (rowFund === colFund)
                            return (
                              <td key={colFund} className="p-1.5 text-center">
                                <div className="w-14 mx-auto py-1.5 rounded bg-[#F1F5F9] text-[#94A3B8] font-medium">—</div>
                              </td>
                            );
                          const pct = result.overlap_matrix[rowFund]?.[colFund] ?? result.overlap_matrix[colFund]?.[rowFund] ?? 0;
                          return (
                            <td key={colFund} className="p-1.5 text-center">
                              <div
                                className="w-14 mx-auto py-1.5 rounded text-xs font-semibold"
                                style={{ background: cellColor(pct), color: cellTextColor(pct) }}
                              >
                                {pct}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-4 mt-3 text-xs text-[#64748B]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-[#DCFCE7]"></span>&lt;20% Low</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-[#FEF9C3]"></span>20–40% Med</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block bg-[#FEE2E2]"></span>&gt;40% High</span>
                </div>
              </div>
            </div>

            {/* Allocation */}
            <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-5">
              <h3 className="text-[#0F172A] font-semibold text-base mb-4">Asset Allocation</h3>
              {/* Stacked bar */}
              <div className="h-12 rounded-xl overflow-hidden flex mb-4">
                {Object.entries(result.allocation).map(([cat, pct]) => (
                  <div
                    key={cat}
                    style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || '#94A3B8' }}
                    className="h-full"
                    title={`${cat}: ${pct}%`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="space-y-2">
                {Object.entries(result.allocation).map(([cat, pct]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] || '#94A3B8' }} />
                      <span className="text-[#374151] text-sm capitalize">{cat.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[#64748B] text-sm font-medium">{pct}%</span>
                  </div>
                ))}
              </div>

              {/* Rebalancing note */}
              <div className="mt-4 p-3 bg-[#F8FAFC] rounded-xl">
                <p className="text-[#64748B] text-xs">
                  <strong className="text-[#374151]">Rebalancing:</strong> Review allocation annually and rebalance if any category drifts more than 5% from target.
                </p>
              </div>
            </div>
          </div>

          {/* AI Rebalancing Card */}
          <AIExplanationCard text={result.reasoning} title="Rebalancing recommendation" />
        </>
      )}
    </div>
  );
}
