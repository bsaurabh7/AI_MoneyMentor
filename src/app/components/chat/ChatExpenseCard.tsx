import React from 'react';
import { PieChart, ShieldAlert, AlertCircle, ArrowUpCircle } from 'lucide-react';

export function ChatExpenseCard({ data }: { data: any }) {
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
      <div className="bg-gradient-to-r from-[#FDF2F8] to-[#FCE7F3] p-4 text-[#831843]">
        <div className="flex items-center gap-2 font-bold mb-1">
          <PieChart className="w-5 h-5 text-[#DB2777]" />
          Cash Flow Analysis
        </div>
        <p className="text-sm opacity-90">{data.context_message}</p>
      </div>
      
      <div className="p-4 grid grid-cols-3 gap-2 text-sm border-b border-[#E2E8F0] bg-slate-50">
        <div>
          <p className="text-[#64748B] text-[10px] uppercase font-bold">Needs</p>
          <p className="font-semibold text-[#0F172A]">₹{data.budget_breakdown?.needs_allocated?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[#64748B] text-[10px] uppercase font-bold">Wants</p>
          <p className="font-semibold text-[#0F172A]">₹{data.budget_breakdown?.wants_allocated?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[#64748B] text-[10px] uppercase font-bold text-[#10B981]">Surplus</p>
          <p className="font-bold text-[#10B981]">₹{data.available_surplus?.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {data.top_overspend_areas?.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1">
               <AlertCircle className="w-4 h-4 text-[#DB2777]" /> Overspend Alerts
            </h4>
            <ul className="space-y-1">
              {data.top_overspend_areas.map((area: string, i: number) => (
                <li key={i} className="text-xs text-[#334155] bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-1.5 before:bg-red-400 before:rounded-full">
                   {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.surplus_allocation_waterfall?.length > 0 && (
          <div>
             <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 flex items-center gap-1">
                <ArrowUpCircle className="w-4 h-4 text-[#10B981]" /> Surplus Action Plan
             </h4>
             <div className="space-y-3">
               {data.surplus_allocation_waterfall.map((step: any, i: number) => (
                 <div key={i} className="flex gap-2 text-xs border-l-2 border-[#DB2777] pl-2 border-opacity-30 relative py-0.5">
                    <div className="font-bold text-[#0F172A] w-14 flex-shrink-0">
                       ₹{(step.amount || 0).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium text-[#DB2777]">{step.category}</span>
                      <p className="text-[#64748B] mt-0.5 leading-tight">{step.rationale}</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
