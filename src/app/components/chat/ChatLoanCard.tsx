import React from 'react';
import { Home, ShieldAlert, ArrowDownRight, Lightbulb } from 'lucide-react';

export function ChatLoanCard({ data }: { data: any }) {
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
      <div className="bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] p-4 text-[#9A3412]">
        <div className="flex items-center gap-2 font-bold mb-1">
          <Home className="w-5 h-5 text-[#EA580C]" />
          Debt Optimization
        </div>
        <p className="text-sm opacity-90">{data.context_message}</p>
      </div>
      
      <div className="p-4 grid gap-3 text-sm border-b border-[#E2E8F0] bg-slate-50">
        <div className="flex items-start gap-2 bg-[#FEF3C7] text-[#92400E] p-2.5 rounded-lg text-xs">
           <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
           <p><strong>{data.payoff_strategy_name}</strong>: {data.invest_vs_prepay_recommendation}</p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <p className="text-[#64748B] text-xs font-semibold uppercase">Total Interest Saved</p>
          <p className="font-bold text-[#10B981]">{data.total_interest_saved}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">Priority Action Plan</h4>
        {data.debts_prioritized?.map((debt: any, i: number) => (
          <div key={i} className="flex flex-col gap-2 bg-white border border-[#E2E8F0] rounded-xl p-3">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <p className="font-bold text-[#0F172A]">{debt.debt_name}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {debt.effective_interest_rate} APR
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-[#64748B] pl-7">
              <p>Old EMI: <span className="line-through">{debt.current_emi}</span></p>
              <div className="flex items-center gap-1 font-bold text-[#EA580C]">
                <ArrowDownRight className="w-3 h-3 text-[#10B981]" />
                {debt.suggested_new_emi}
              </div>
            </div>
            <p className="pl-7 text-[10px] text-[#94A3B8]">Paid off in {debt.months_to_payoff} months</p>
          </div>
        ))}
      </div>
    </div>
  );
}
