import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Save, CheckCircle2 } from 'lucide-react';
import { analyzePortfolio, formatINR, formatCr, type Fund, type PortfolioResponse } from '../../utils/finCalc';
import { AIExplanationCard } from '../shared/AIExplanationCard';
import { MetricCard } from '../shared/MetricCard';
import { StatusPill } from '../shared/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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

// Start with empty funds
const INITIAL_FUNDS: Fund[] = [];

async function fetchCurrentValuesFromScraper(funds: Fund[]): Promise<Fund[]> {
  try {
    const payload = funds.map(f => ({
      id: f.id,
      name: f.name,
      sip_amount: f.sip_amount,
      sip_start_date: f.sip_start_date,
      category: f.category
    }));

    const res = await fetch('http://localhost:8000/api/agents/mf-analyzer/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funds: payload })
    });

    if (!res.ok) throw new Error("API Error");
    const data = await res.json();
    
    // Map backend output back into funds
    return funds.map(f => {
      const match = data.find((p: any) => p.id === f.id);
      return {
        ...f,
        amount_invested: match?.amount_invested || f.amount_invested,
        current_value: match?.current_value || f.current_value,
      };
    });
  } catch (err) {
    console.error('MF Scraper API failed:', err);
    throw err;
  }
}

export function PortfolioXRay() {
  const { user } = useAuth();
  const [funds, setFunds] = useState<Fund[]>(INITIAL_FUNDS);
  const [result, setResult] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch saved portfolio on mount
  useEffect(() => {
    async function loadPortfolio() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('portfolio_funds')
          .select('*')
          .eq('user_id', user.id);
        
        if (!error && data && data.length > 0) {
          const mappedFunds: Fund[] = data.map((row: any) => ({
            id: row.id,
            name: row.fund_name,
            sip_amount: row.sip_amount,
            sip_start_date: row.sip_start_date,
            amount_invested: row.amount_invested,
            current_value: row.current_value,
            category: row.category,
          }));
          setFunds(mappedFunds);
        } else if (data && data.length === 0) {
          // Add one empty row so it looks nicely blank
          setFunds([{ id: uuidv4(), name: '', sip_amount: 0, sip_start_date: '', amount_invested: 0, current_value: 0, category: 'large_cap' }]);
        }
      } catch (err) {
        console.error("Failed to load portfolio", err);
      } finally {
        setInitialLoad(false);
      }
    }
    loadPortfolio();
  }, [user]);

  const updateFund = (id: string, k: keyof Fund) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFunds((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value } : f))
    );
  };

  const addFund = () => {
    setFunds((prev) => [
      ...prev,
      { id: uuidv4(), name: '', sip_amount: 0, sip_start_date: '', amount_invested: 0, current_value: 0, category: 'large_cap' },
    ]);
  };

  const removeFund = async (id: string) => {
    setFunds((prev) => prev.filter((f) => f.id !== id));
    if (user) {
      await supabase.from('portfolio_funds').delete().eq('id', id).eq('user_id', user.id);
    }
  };

  const handleFetchAndSave = async () => {
    if (!user) return;
    const valid = funds.filter((f) => f.name && f.sip_amount > 0 && f.sip_start_date);
    if (valid.length === 0) return;
    
    setLoading(true);
    try {
      // 1. Fetch real values from Python MF Scraper endpoint
      const computedFunds = await fetchCurrentValuesFromScraper(valid);
      
      // Update local state to reflect exact values
      setFunds((prev) => {
        const newFunds = prev.map(f => {
          const c = computedFunds.find(x => x.id === f.id);
          return c ? c : f;
        });
        return newFunds;
      });

      // 2. Persist to Supabase
      const upsertRows = computedFunds.map(f => ({
        id: f.id,
        user_id: user.id,
        fund_name: f.name,
        sip_amount: f.sip_amount,
        sip_start_date: f.sip_start_date,
        amount_invested: f.amount_invested,
        current_value: f.current_value,
        category: f.category,
      }));
      await supabase.from('portfolio_funds').upsert(upsertRows);
      
    } catch (err) {
      setError('Wait, backend scraper failed. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    const valid = funds.filter((f) => f.name && (f.amount_invested > 0 || f.sip_amount > 0));
    if (valid.length < 2) {
      setError('Please sync and enter at least 2 valid funds.');
      return;
    }
    setError('');
    
    // Ensure all valid funds currently have amount_invested != 0 (meaning they were saved/synced)
    const unsynced = valid.filter(f => f.amount_invested === 0);
    if (unsynced.length > 0) {
      await handleFetchAndSave();
    }

    setLoading(true);
    try {
      // Analyze mathematically locally
      const analysisResult = analyzePortfolio(valid);
      setResult(analysisResult);

      // Save the analysis report globally
      if (user) {
         await supabase.from('portfolio_analysis').upsert({
           user_id: user.id,
           total_invested: analysisResult.total_invested,
           total_current: analysisResult.total_current,
           xirr: analysisResult.xirr,
           avg_expense_ratio: analysisResult.avg_expense_ratio,
           benchmark_return: analysisResult.benchmark_return,
           overlap_severity: analysisResult.overlap_severity.toLowerCase(),
           overlap_matrix: analysisResult.overlap_matrix,
           allocation: analysisResult.allocation,
           ai_reasoning: analysisResult.reasoning,
           created_at: new Date().toISOString()
         }, { onConflict: 'user_id' });
      }

    } catch (err) {
      setError('Failed to analyze funds.');
    } finally {
      setLoading(false);
    }
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
    ? funds.filter((f) => f.name && (f.amount_invested > 0 || f.sip_amount > 0)).map((f) => f.name)
    : [];

  if (initialLoad) return <div className="p-8"><div className="w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div>
        <h2 className="text-[#0F172A] font-bold text-2xl">MF Portfolio X-Ray</h2>
        <p className="text-[#64748B] text-sm mt-1">Analyze overlap, returns, and rebalancing needs utilizing live data.</p>
      </div>

      {/* Fund Entry Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#0F172A] font-semibold text-base">Your Mutual Funds</h3>
            <p className="text-[#64748B] text-xs mt-0.5">Click 'Sync Values' to scrape live nav/returns and update your DB</p>
          </div>
          <button
            onClick={handleFetchAndSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#F1F5F9] text-[#0F172A] rounded-xl font-medium text-sm hover:bg-[#E2E8F0] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4"/> Sync Values
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                {['Fund Name', 'SIP Amount (₹)', 'SIP Start', 'Category', 'Est. Curr. Value', ''].map((h) => (
                  <th key={h} className={`text-left text-[#64748B] text-xs font-medium py-2 pr-3 ${h === '' ? 'w-8' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {funds.map((f) => (
                <tr key={f.id} className="group hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2 pr-3">
                    <input
                      type="text"
                      className={inputClass}
                      value={f.name}
                      onChange={updateFund(f.id, 'name')}
                      placeholder="e.g. Nippon India Small Cap"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      className={inputClass}
                      value={f.sip_amount || ''}
                      onChange={updateFund(f.id, 'sip_amount')}
                      placeholder="5000"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="month"
                      className={inputClass}
                      value={f.sip_start_date || ''}
                      onChange={updateFund(f.id, 'sip_start_date')}
                      placeholder="YYYY-MM"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select className={inputClass} value={f.category} onChange={updateFund(f.id, 'category')}>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                     <span className={`text-sm font-semibold ${f.current_value > 0 ? 'text-[#10B981]' : 'text-[#94A3B8]'}`}>
                       {f.current_value > 0 ? formatINR(f.current_value) : '—'}
                     </span>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeFund(f.id)}
                      disabled={funds.length === 0}
                      className="text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:text-[#EF4444] disabled:opacity-30 transition-all"
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
            <div key={f.id} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] space-y-2 relative">
              <button 
                onClick={() => removeFund(f.id)} 
                className="absolute top-3 right-3 text-[#94A3B8] hover:text-[#EF4444]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="pr-6">
                <input type="text" className="w-full bg-transparent font-medium text-sm border-b border-dashed border-[#CBD5E1] pb-1 mb-2 outline-none focus:border-[#6366F1]" value={f.name} onChange={updateFund(f.id, 'name')} placeholder="Fund name" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input type="number" className={inputClass} value={f.sip_amount || ''} onChange={updateFund(f.id, 'sip_amount')} placeholder="SIP Amount ₹" />
                <input type="month" className={inputClass} value={f.sip_start_date || ''} onChange={updateFund(f.id, 'sip_start_date')} />
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <select className={inputClass} value={f.category} onChange={updateFund(f.id, 'category')}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <div className="text-right">
                  <span className={`text-xs font-semibold ${f.current_value > 0 ? 'text-[#10B981]' : 'text-[#64748B]'}`}>
                    {f.current_value > 0 ? formatINR(f.current_value) : 'Sync to calc'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-[#EF4444] text-xs mt-3 flex items-center gap-1">⚠️ {error}</p>}

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 gap-3 pt-4 border-t border-[#F1F5F9]">
          <button
            onClick={addFund}
            className="flex items-center gap-1 text-[#6366F1] text-sm font-semibold hover:text-[#4F46E5] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add next fund row
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-bold transition-colors disabled:opacity-60 w-full md:w-auto justify-center"
          >
            <TrendingUp className="w-4 h-4" />
            {loading ? 'Crunching Numbers...' : 'Analyze My Portfolio'}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && !result && (
        <div className="space-y-4">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-2 h-24 animate-pulse"></div>
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
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1 shadow-sm">
              <p className="text-[#64748B] text-xs mb-2">Overlap Severity</p>
              <StatusPill
                variant={result.overlap_severity === 'Low' ? 'success' : result.overlap_severity === 'Medium' ? 'warning' : 'danger'}
                label={result.overlap_severity}
              />
            </div>
          </div>

          {/* Total Summary */}
          <div className="flex flex-col md:flex-row flex-wrap gap-4 px-5 py-4 bg-gradient-to-r from-[#F8FAFC] to-white border border-[#E2E8F0] rounded-xl text-sm shadow-sm justify-around">
            <div className="text-center md:text-left">
              <span className="text-[#64748B] block text-xs font-semibold uppercase tracking-wider mb-1">Total Invested</span>
              <span className="font-extrabold text-xl text-[#0F172A]">{formatINR(result.total_invested)}</span>
            </div>
            <div className="w-px bg-[#E2E8F0] hidden md:block"></div>
            <div className="text-center md:text-left">
              <span className="text-[#64748B] block text-xs font-semibold uppercase tracking-wider mb-1">Current Value</span>
              <span className="font-extrabold text-xl text-[#10B981] flex items-center gap-1.5 justify-center md:justify-start">
                 {formatINR(result.total_current)}
                 <CheckCircle2 className="w-4 h-4 text-[#10B981]"/>
              </span>
            </div>
            <div className="w-px bg-[#E2E8F0] hidden md:block"></div>
            <div className="text-center md:text-left">
              <span className="text-[#64748B] block text-xs font-semibold uppercase tracking-wider mb-1">Total Gain</span>
              <span className={`font-extrabold text-xl ${result.total_current >= result.total_invested ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {result.total_current >= result.total_invested ? '+' : ''}{formatINR(result.total_current - result.total_invested)}
              </span>
            </div>
          </div>

          {/* Overlap + Allocation */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Overlap Matrix */}
            <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm overflow-hidden">
              <h3 className="text-[#0F172A] font-semibold text-base mb-4">Fund Overlap Heatmap</h3>
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <table className="text-xs border-collapse w-full min-w-[300px]">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-[#94A3B8] text-left text-xs w-28"></th>
                      {fundNames.map((name) => (
                        <th key={name} className="p-1.5 text-[#64748B] text-center font-medium">
                          <div className="w-20 truncate mx-auto" title={name}>{name.substring(0, 15)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fundNames.map((rowFund) => (
                      <tr key={rowFund} className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC]">
                        <td className="p-2 text-[#64748B] font-semibold text-xs border-r border-[#F1F5F9]">
                          <div className="w-28 truncate" title={rowFund}>{rowFund.substring(0, 18)}</div>
                        </td>
                        {fundNames.map((colFund) => {
                          if (rowFund === colFund)
                            return (
                              <td key={colFund} className="p-1.5 text-center bg-[#F8FAFC]">
                                <div className="w-full h-full flex items-center justify-center text-[#CBD5E1] font-bold">—</div>
                              </td>
                            );
                          const pct = result.overlap_matrix[rowFund]?.[colFund] ?? result.overlap_matrix[colFund]?.[rowFund] ?? 0;
                          return (
                            <td key={colFund} className="p-1.5 text-center hover:bg-black/5 transition-colors">
                              <div
                                className="w-14 mx-auto py-1.5 rounded-lg text-xs font-bold shadow-sm"
                                style={{ background: cellColor(pct), color: cellTextColor(pct) }}
                                title={`${pct}% Overlap between ${rowFund} and ${colFund}`}
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
                <div className="flex items-center gap-5 mt-5 px-2 text-xs text-[#64748B] font-medium border-t border-[#F1F5F9] pt-4">
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full border border-black/10 bg-[#DCFCE7]"></span>&lt;20% Low</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full border border-black/10 bg-[#FEF9C3]"></span>20–40% Med</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full border border-black/10 bg-[#FEE2E2]"></span>&gt;40% High</span>
                </div>
              </div>
            </div>

            {/* Allocation */}
            <div className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
              <h3 className="text-[#0F172A] font-semibold text-base mb-4">Asset Allocation</h3>
              {/* Stacked bar */}
              <div className="h-10 rounded-full overflow-hidden flex mb-5 shadow-inner">
                {Object.entries(result.allocation).map(([cat, pct]) => (
                  <div
                    key={cat}
                    style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || '#94A3B8' }}
                    className="h-full hover:opacity-90 transition-opacity cursor-pointer border-r border-white/20 last:border-0"
                    title={`${cat.replace('_', ' ')}: ${pct}%`}
                  />
                ))}
              </div>
              {/* Legend Grid */}
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {Object.entries(result.allocation).sort((a,b) => b[1] - a[1]).map(([cat, pct]) => (
                  <div key={cat} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ background: CATEGORY_COLORS[cat] || '#94A3B8' }} />
                      <span className="text-[#374151] font-medium text-sm capitalize">{cat.replace('_', ' ')}</span>
                    </div>
                    <span className="text-[#0F172A] font-bold text-sm bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-md shadow-sm">{pct}%</span>
                  </div>
                ))}
              </div>

              {/* Rebalancing note */}
              <div className="mt-6 p-4 bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                <p className="text-[#475569] text-xs leading-relaxed">
                  <strong className="text-[#0F172A]">Rebalancing Protocol:</strong> Re-evaluate your allocation annually and execute rebalancing if any category drifts &gt;5% from your target trajectory.
                </p>
              </div>
            </div>
          </div>

          {/* AI Rebalancing Card */}
          <AIExplanationCard text={result.reasoning} title="AI Rebalancing Assessment" />
        </>
      )}
    </div>
  );
}
