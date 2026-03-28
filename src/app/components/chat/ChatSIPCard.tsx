import React from 'react';
import { TrendingUp, ShieldAlert } from 'lucide-react';

export function ChatSIPCard({ data }: { data: any }) {
  if (data.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
        <div className="flex items-center gap-2 font-bold mb-1">
          <ShieldAlert className="w-4 h-4" /> Error
        </div>
        {data.error}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm max-w-sm">
      <div className="bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] p-4 text-[#3730A3]">
        <div className="flex items-center gap-2 font-bold mb-1">
          <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
          AI Mutual Fund Strategy
        </div>
        <p className="text-sm opacity-90">{data.context_message}</p>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-3 text-sm border-b border-[#E2E8F0] bg-slate-50">
        <div>
          <p className="text-[#64748B] text-xs">Risk Profile</p>
          <p className="font-semibold text-[#0F172A] capitalize">{data.risk_profile}</p>
        </div>
        <div>
          <p className="text-[#64748B] text-xs">Target SIP</p>
          <p className="font-semibold text-[#0F172A]">{data.monthly_sip_target}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">Recommended Funds</h4>
        {data.fund_allocations?.map((fund: any, i: number) => (
          <div 
            key={i} 
            onClick={() => window.open(`https://www.moneycontrol.com/mutual-funds/nav/${fund.fund_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, '_blank')}
            className="bg-white border border-[#E2E8F0] rounded-xl p-3 hover:border-[#6366F1] hover:bg-[#EEF2FF] transition-colors cursor-pointer group relative"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">{fund.fund_name} <span className="inline-block opacity-0 group-hover:opacity-100 transition-opacity ml-1">↗</span></p>
                <p className="text-xs text-[#64748B]">{fund.category} • {fund.expense_ratio} ER</p>
              </div>
              <div className="text-right">
                <p className="text-[#10B981] font-bold text-sm">+{fund.cagr_5y}</p>
                <p className="text-[10px] text-[#64748B]">5Y CAGR</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <div className="bg-[#F8FAFC] px-2 py-1 rounded text-xs font-semibold text-[#334155] border border-[#E2E8F0]">
                {fund.suggested_sip_amount}/mo
              </div>
              <p className="text-xs text-[#64748B] italic flex-1 leading-tight">{fund.rationale}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-[#F8FAFC] px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
        <span>Corpus Target: <strong>{data.fire_corpus_target}</strong></span>
        <button 
          onClick={() => window.open('https://coin.zerodha.com/', '_blank')}
          className="font-medium text-[#4F46E5] hover:underline"
        >
          Invest Now →
        </button>
      </div>
    </div>
  );
}
