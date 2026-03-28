import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/finCalc';
import { PieChart, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

interface FundSummary {
  id: string;
  fund_name: string;
  category: string;
  sip_amount: number;
  current_value: number;
  amount_invested: number;
}

export function PortfolioSummary({ onTotalValueChange }: { onTotalValueChange?: (total: number) => void }) {
  const { user } = useAuth();
  const [funds, setFunds] = useState<FundSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFunds() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('portfolio_funds')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          setFunds(data);
          const total = data.reduce((sum, f) => sum + (f.current_value || 0), 0);
          if (onTotalValueChange) onTotalValueChange(total);
        }
      } catch (err) {
        console.error('Failed to fetch portfolio summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFunds();
  }, [user, onTotalValueChange]);

  if (loading) {
    return (
      <div className="flex justify-center p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  if (funds.length === 0) {
    return null; // Don't show if no funds found
  }

  const totalCurrentValue = funds.reduce((sum, f) => sum + (f.current_value || 0), 0);
  const totalInvested = funds.reduce((sum, f) => sum + (f.amount_invested || 0), 0);
  const totalGain = totalCurrentValue - totalInvested;
  const gainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[#0F172A] font-bold text-lg flex items-center gap-2">
          <PieChart className="w-5 h-5 text-[#6366F1]" /> Live Portfolio Summary
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">
          SYNCED LIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <p className="text-[#64748B] text-xs font-medium uppercase mb-1">Current Value</p>
          <p className="text-[#0F172A] font-extrabold text-xl">{formatINR(totalCurrentValue)}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <p className="text-[#64748B] text-xs font-medium uppercase mb-1">Total Invested</p>
          <p className="text-[#334155] font-bold text-lg">{formatINR(totalInvested)}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <p className="text-[#64748B] text-xs font-medium uppercase mb-1">Return</p>
          <p className={`font-bold text-lg ${totalGain >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {totalGain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto overflow-hidden rounded-xl border border-[#F1F5F9]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC]">
              <th className="px-4 py-3 text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Fund Name</th>
              <th className="px-4 py-3 text-[#64748B] text-[11px] font-bold uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-[#64748B] text-[11px] font-bold uppercase tracking-wider text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {funds.map((f) => (
              <tr key={f.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-4 py-3 text-[#0F172A] text-sm font-medium">{f.fund_name}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-semibold text-[#64748B] px-2 py-0.5 rounded-full bg-[#F1F5F9] capitalize">
                    {f.category.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[#0F172A] text-sm font-semibold">{formatINR(f.current_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE]">
        <TrendingUp className="w-4 h-4 text-[#6366F1]" />
        <p className="text-[#3730A3] text-xs font-medium">
          This data is used by **Arthmize** to boost your FIRE result and Money Health Score.
        </p>
      </div>
    </div>
  );
}
