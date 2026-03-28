import React from 'react';
import { ShieldCheck, ShieldAlert, HeartPulse, Building2 } from 'lucide-react';

export function ChatInsuranceCard({ data }: { data: any }) {
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
      <div className="bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] p-4 text-[#166534]">
        <div className="flex items-center gap-2 font-bold mb-1">
          <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
          AI Protection Shield
        </div>
        <p className="text-sm opacity-90">{data.context_message}</p>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">Top Recommendations</h4>
        {data.recommendations?.map((plan: any, i: number) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-3 hover:border-[#16A34A] transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                  <p className="text-xs text-[#64748B] font-medium">{plan.provider}</p>
                </div>
                <p className="font-bold text-[#0F172A]">{plan.plan_name}</p>
              </div>
              <div className="text-right">
                <p className="text-[#0F172A] font-bold text-sm">{plan.approximate_premium}</p>
                <p className="text-[10px] text-[#64748B]">approx</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <div className="bg-[#F0FDF4] text-[#166534] px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border border-[#DCFCE7]">
                <HeartPulse className="w-3 h-3" /> {plan.claim_settlement_ratio} CSR
              </div>
              <p className="text-xs text-[#64748B] italic flex-1 leading-tight">{plan.trust_note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
