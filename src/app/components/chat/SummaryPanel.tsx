import { CheckCircle, Circle, TrendingUp, Landmark, CreditCard, HandCoins, UserCheck, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';
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
  const navigate = useNavigate();

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
                onClick={() => navigate('/profile', { state: { editMode: true } })} 
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
        {/* ── Quick Actions ── */}
        <div>
          <h3 className="text-[#64748B] text-xs font-semibold uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                icon: <TrendingUp className="w-4 h-4" />,
                label: 'Open Demat Account',
                desc: 'Start investing in stocks & MFs',
                color: '#6366F1',
                bg: '#EEF2FF',
                border: '#C7D2FE',
                url: 'https://zerodha.com/open-account',
              },
              {
                icon: <Landmark className="w-4 h-4" />,
                label: 'High-Yield Savings',
                desc: 'Earn up to 7% on idle cash',
                color: '#10B981',
                bg: '#F0FDF4',
                border: '#BBF7D0',
                url: 'https://www.fi.money',
              },
              {
                icon: <CreditCard className="w-4 h-4" />,
                label: 'Apply for Credit Card',
                desc: 'Cashback & rewards for your spend',
                color: '#8B5CF6',
                bg: '#F5F3FF',
                border: '#DDD6FE',
                url: 'https://www.bankbazaar.com/credit-card.html',
              },
              {
                icon: <HandCoins className="w-4 h-4" />,
                label: 'Compare Loan Rates',
                desc: 'Home, personal & education loans',
                color: '#EA580C',
                bg: '#FFF7ED',
                border: '#FED7AA',
                url: 'https://www.paisabazaar.com/personal-loan/',
              },
              {
                icon: <UserCheck className="w-4 h-4" />,
                label: 'Talk to an Advisor',
                desc: 'SEBI-registered financial planner',
                color: '#0891B2',
                bg: '#ECFEFF',
                border: '#A5F3FC',
                url: 'https://www.hdfcbank.com/personal/invest',
              },
              {
                icon: <FileText className="w-4 h-4" />,
                label: 'Export Report',
                desc: 'Download your financial summary',
                color: '#64748B',
                bg: '#F8FAFC',
                border: '#E2E8F0',
                action: 'export',
              },
            ].map((card) => (
              <button
                key={card.label}
                onClick={() => {
                  if (card.action === 'export') {
                    window.print();
                  } else if (card.url) {
                    window.open(card.url, '_blank', 'noopener');
                  }
                }}
                className="group flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                style={{ background: card.bg, borderColor: card.border }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: card.color + '18', color: card.color }}
                >
                  {card.icon}
                </div>
                <div>
                  <p className="text-[#0F172A] text-xs font-bold leading-tight flex items-center gap-1">
                    {card.label}
                    {card.url && <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />}
                  </p>
                  <p className="text-[#64748B] text-[10px] leading-tight mt-0.5">{card.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-2">
          <p className="text-[10px] text-[#92400E] leading-relaxed">
            <strong>Disclaimer:</strong> Links are for informational purposes only. Arthmize does not receive commissions and is not a SEBI-registered advisor. Always do your own research.
          </p>
        </div>
      </div>
    </div>
  );
}