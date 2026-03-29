import { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Database } from 'lucide-react';
import { calculateTax, formatINR, type TaxInputs, type TaxResponse } from '../../utils/finCalc';
import { AIExplanationCard } from '../shared/AIExplanationCard';
import { StatusPill } from '../shared/StatusPill';
import { useAuth } from '../../context/AuthContext';

const EMPTY: TaxInputs = {
  salary: 0,
  hra_received: 0,
  rent_paid: 0,
  city_type: 'metro',
  deduction_80c: 0,
  deduction_80d: 0,
  nps_80ccd: 0,
};

function TaxBreakdown({ data, label, isWinner }: { data: TaxResponse['old_regime']; label: string; isWinner: boolean }) {
  const borderStyle = isWinner ? { border: '2px solid #10B981' } : {};
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex-1 relative" style={borderStyle}>
      {isWinner && (
        <div className="absolute -top-3 right-4">
          <StatusPill variant="best" label="Best for you" />
        </div>
      )}
      <h3 className="text-[#0F172A] font-semibold text-base mb-1">{label}</h3>
      <p className={`text-3xl font-bold mb-4 ${isWinner ? 'text-[#10B981]' : 'text-[#0F172A]'}`}>
        {formatINR(data.total_tax)}
      </p>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-[#F1F5F9]">
          {[
            ['Taxable Income', formatINR(data.taxable_income)],
            ['Total Deductions', formatINR(data.deductions)],
            ['Tax', formatINR(data.tax_before_cess)],
            ['Cess (4%)', formatINR(data.cess)],
          ].map(([key, val]) => (
            <tr key={key}>
              <td className="py-1.5 text-[#64748B]">{key}</td>
              <td className="py-1.5 text-[#0F172A] text-right">{val}</td>
            </tr>
          ))}
          <tr>
            <td className="py-1.5 text-[#0F172A] font-semibold">Final Tax</td>
            <td className={`py-1.5 text-right font-bold ${isWinner ? 'text-[#10B981]' : 'text-[#0F172A]'}`}>
              {formatINR(data.total_tax)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function TaxOptimizer() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState<TaxInputs>(EMPTY);
  const [result, setResult] = useState<TaxResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [activeView, setActiveView] = useState<'form' | 'analysis'>('form');
  const optimizerRef = useRef<HTMLDivElement | null>(null);
  const leftTopAfterCalcRef = useRef(false);
  const [dataSource, setDataSource] = useState<'profile' | 'partial' | 'empty'>('empty');

  // Pre-fill from Supabase profile whenever it loads
  useEffect(() => {
    if (!profile) return;
    const p = profile as any;
    const fromDb: TaxInputs = {
      salary:        p.annual_income      ?? 0,
      hra_received:  p.hra_received       ?? 0,
      rent_paid:     p.rent_paid_monthly  ?? 0,
      city_type:     p.city_type          ?? 'metro',
      deduction_80c: p.deduction_80c      ?? 0,
      deduction_80d: p.deduction_80d      ?? 0,
      nps_80ccd:     p.nps_80ccd          ?? 0,
    };
    setForm(fromDb);
    const hasSalary = !!fromDb.salary;
    const hasDeductions = fromDb.deduction_80c > 0 || fromDb.deduction_80d > 0 || fromDb.nps_80ccd > 0;
    if (hasSalary && hasDeductions) setDataSource('profile');
    else if (hasSalary)             setDataSource('partial');
    else                            setDataSource('empty');
  }, [profile]);

  const set = (k: keyof TaxInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [k]: val }));
  };

  const handleCalculate = () => {
    if (!form.salary || form.salary <= 0) {
      setError('Please enter a valid annual salary.');
      return;
    }
    setError('');
    setHasCalculated(true);
    leftTopAfterCalcRef.current = false;
    setActiveView('analysis');
    setLoading(true);
    setTimeout(() => { setResult(calculateTax(form)); setLoading(false); }, 600);
  };

  useEffect(() => {
    if (!hasCalculated) return;
    const optimizerEl = optimizerRef.current;
    if (!optimizerEl) return;

    const findScrollableParent = (start: HTMLElement): HTMLElement | Window => {
      let node: HTMLElement | null = start.parentElement;
      while (node) {
        const { overflowY } = window.getComputedStyle(node);
        if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
      return window;
    };

    const scrollHost = findScrollableParent(optimizerEl);
    const getScrollTop = () =>
      scrollHost === window
        ? window.scrollY || document.documentElement.scrollTop || 0
        : (scrollHost as HTMLElement).scrollTop;

    const onScroll = () => {
      const atTop = getScrollTop() <= 8;

      if (!atTop) {
        leftTopAfterCalcRef.current = true;
        setActiveView('analysis');
        return;
      }

      if (leftTopAfterCalcRef.current) {
        setActiveView('form');
      }
    };

    if (scrollHost === window) {
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    (scrollHost as HTMLElement).addEventListener('scroll', onScroll, { passive: true });
    return () => (scrollHost as HTMLElement).removeEventListener('scroll', onScroll);
  }, [hasCalculated]);

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-colors';
  const labelClass = 'block text-[#374151] text-sm font-medium mb-1.5';

  return (
    <div ref={optimizerRef} className="p-6 md:p-8 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="text-[#0F172A] font-bold text-2xl">Tax Regime Optimizer</h2>
        <p className="text-[#64748B] text-sm mt-1">Find which tax regime saves you more money</p>
      </div>

      {/* Data Source Status Banner */}
      {user && (
        <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium border ${
          dataSource === 'profile' ? 'bg-[#D1FAE5] border-[#6EE7B7] text-[#065F46]' :
          dataSource === 'partial' ? 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E]' :
                                     'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
        }`}>
          {dataSource === 'profile' && <><Database className="w-4 h-4 flex-shrink-0" /> Loaded from your profile — review and click Analyze</>}
          {dataSource === 'partial' && <><AlertCircle className="w-4 h-4 flex-shrink-0" /> Some fields are missing — fill them in below</>}
          {dataSource === 'empty'   && <><AlertCircle className="w-4 h-4 flex-shrink-0" /> No profile data found — complete the chat first or enter values manually</>}
        </div>
      )}

      {/* Input Card */}
      <div
        className={`bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-4 transform transition-all duration-500 ease-out ${
          hasCalculated && activeView === 'analysis'
            ? '-translate-x-8 opacity-0 max-h-0 overflow-hidden pointer-events-none p-0 border-transparent'
            : 'translate-x-0 opacity-100 max-h-[2200px]'
        }`}
      >
        <h3 className="text-[#0F172A] font-semibold text-base mb-4">Your income &amp; deductions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Annual Salary (₹){' '}
              {!form.salary && <span className="text-amber-500 text-xs font-normal ml-1">Required</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
              <input type="number" className={`${inputClass} pl-7 ${!form.salary ? 'border-amber-300 focus:border-amber-400' : ''}`}
                value={form.salary || ''} onChange={set('salary')} placeholder="e.g. 1800000" />
            </div>
          </div>
          <div>
            <label className={labelClass}>HRA Received (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
              <input type="number" className={`${inputClass} pl-7`} value={form.hra_received || ''}
                onChange={set('hra_received')} placeholder="0 if not applicable" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Rent Paid per month (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
              <input type="number" className={`${inputClass} pl-7`} value={form.rent_paid || ''}
                onChange={set('rent_paid')} placeholder="0 if you own home" />
            </div>
          </div>
          <div>
            <label className={labelClass}>City Type</label>
            <select className={inputClass} value={form.city_type} onChange={set('city_type')}>
              <option value="metro">Metro</option>
              <option value="non-metro">Non-Metro</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>80C Deductions (₹ max 1.5L)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
              <input type="number" className={`${inputClass} pl-7`} value={form.deduction_80c || ''}
                onChange={set('deduction_80c')} max={150000} placeholder="0 if none" />
            </div>
            {form.deduction_80c > 150000 && <p className="text-[#EF4444] text-xs mt-1">Max limit is ₹1,50,000</p>}
          </div>
          <div>
            <label className={labelClass}>80D Health Insurance (₹ max 25K)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
              <input type="number" className={`${inputClass} pl-7`} value={form.deduction_80d || ''}
                onChange={set('deduction_80d')} max={25000} placeholder="0 if none" />
            </div>
          </div>
          <div>
            <label className={labelClass}>NPS 80CCD(1B) (₹ max 50K)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">₹</span>
              <input type="number" className={`${inputClass} pl-7`} value={form.nps_80ccd || ''}
                onChange={set('nps_80ccd')} max={50000} placeholder="0 if none" />
            </div>
          </div>
        </div>
        {error && <p className="text-[#EF4444] text-sm mt-3">{error}</p>}
        <button onClick={handleCalculate} disabled={loading}
          className="mt-5 w-full py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold text-sm transition-colors disabled:opacity-60">
          {loading ? 'Calculating...' : 'Analyze Tax Regimes'}
        </button>
      </div>

      <div
        className={`space-y-5 transform transition-all duration-500 ease-out ${
          hasCalculated && activeView === 'form'
            ? 'opacity-0 translate-y-5 max-h-0 overflow-hidden pointer-events-none'
            : 'opacity-100 translate-y-0 max-h-[10000px]'
        }`}
      >
        {/* Loading skeleton */}
        {loading && (
          <div className="flex gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex-1 bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-3">
                <div className="h-4 bg-[#F1F5F9] rounded animate-pulse w-1/3" />
                <div className="h-8 bg-[#F1F5F9] rounded animate-pulse w-1/2" />
                <div className="space-y-2 pt-2">
                  {[1,2,3,4,5].map((j) => <div key={j} className="h-3 bg-[#F1F5F9] rounded animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#D1FAE5] border border-[#6EE7B7]">
              <CheckCircle className="w-4 h-4 text-[#065F46]" />
              <p className="text-[#065F46] text-sm font-medium">
                You save {formatINR(result.savings)} by choosing the{' '}
                <strong>{result.winner === 'old' ? 'Old' : 'New'} Regime</strong>
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <TaxBreakdown data={result.old_regime} label="Old Regime" isWinner={result.winner === 'old'} />
              <TaxBreakdown data={result.new_regime} label="New Regime" isWinner={result.winner === 'new'} />
            </div>
            <AIExplanationCard text={result.reasoning} />
          </>
        )}
      </div>
    </div>
  );
}
