import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  User, Briefcase, Calendar, MapPin, Heart,
  Wallet, DollarSign, TrendingUp, Home, CreditCard, ShieldAlert,
  ArrowRight, Loader2, Compass, Shield, PieChart, AlertTriangle,
  CheckCircle2, XCircle, Clock
} from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function fetchProfile() {
      try {
        const { data: p, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .limit(1);
        if (!error && p && p.length > 0) {
          setData(p[0]);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  const fmt = (n: number | null | undefined) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  const fmtStr = (s: string | null | undefined) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '—';
  const fmtPct = (n: number | null | undefined) => n ? `${(Number(n) <= 1 ? Number(n) * 100 : Number(n)).toFixed(1)}%` : '—';
  const bool = (v: boolean | null | undefined) =>
    v === true ? <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium"><CheckCircle2 className="w-4 h-4" />Yes</span>
    : v === false ? <span className="flex items-center gap-1 text-red-500 text-sm font-medium"><XCircle className="w-4 h-4" />No</span>
    : <span className="text-slate-400 text-sm">—</span>;

  const emergencyLabel = (m: string | null | undefined) => {
    if (!m) return '—';
    const map: Record<string, string> = { '<1': '< 1 month', '1-3': '1–3 months', '3-6': '3–6 months', '>6': '6+ months' };
    return map[m] ?? m;
  };

  const emergencyColor = (m: string | null | undefined) => {
    if (m === '>6') return 'text-emerald-600';
    if (m === '3-6') return 'text-blue-600';
    if (m === '1-3') return 'text-amber-600';
    return 'text-red-500';
  };

  const noData = !data;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16 bg-white border-b border-[#E2E8F0] sticky top-0 z-10">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#0F172A] font-bold text-lg">Arthmize</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFBEB] border border-[#FCD34D]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#92400E]" />
            <span className="text-[#92400E] text-xs font-medium">Not financial advice</span>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-2">Your Financial Profile</h1>
            <p className="text-[#64748B]">
              {noData
                ? 'No data yet — complete the AI chat to build your profile.'
                : 'Your complete financial picture, collected via AI chat.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors"
          >
            {noData ? 'Start AI Chat' : 'Update via Chat'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {noData ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#6366F1] p-12 text-center">
            <Compass className="w-12 h-12 text-[#6366F1] mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">No profile data yet</h2>
            <p className="text-slate-500 mb-6">Start an AI chat to build your Tax, FIRE & Money Health profile automatically.</p>
            <button onClick={() => navigate('/chat')} className="px-6 py-2.5 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors">
              Start Chat →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">

            {/* Profile & Household */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <User className="w-4 h-4 text-[#6366F1]" /> Profile &amp; Household
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Employment', icon: <Briefcase className="w-3.5 h-3.5" />, value: fmtStr(data?.employment_type) },
                  { label: 'Age', icon: <Calendar className="w-3.5 h-3.5" />, value: data?.date_of_birth ? (new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()) + ' yrs' : '—' },
                  { label: 'City Type', icon: <MapPin className="w-3.5 h-3.5" />, value: fmtStr(data?.city_type) },
                  { label: 'Marital Status', icon: <Heart className="w-3.5 h-3.5" />, value: fmtStr(data?.marital_status) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 flex items-center gap-2">{row.icon}{row.label}</span>
                    <span className="text-sm font-medium text-slate-800">{row.value as string}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Streams */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <Wallet className="w-4 h-4 text-[#10B981]" /> Income Streams
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Base Salary (Annual)', value: fmt(data?.annual_income), color: 'text-emerald-600' },
                  { label: 'HRA Received (Annual)', value: fmt(data?.hra_received), color: 'text-slate-800' },
                  { label: 'EPF (Monthly)', value: fmt(data?.epf_monthly), color: 'text-slate-800' },
                  { label: 'Secondary Income (Monthly)', value: fmt(data?.secondary_income_monthly), color: 'text-emerald-600' },
                  { label: 'Passive Income (Monthly)', value: fmt(data?.passive_income_monthly), color: 'text-emerald-600' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className={`text-sm font-medium ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <DollarSign className="w-4 h-4 text-[#F59E0B]" /> Expenses
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Fixed Monthly', value: fmt(data?.monthly_expense), color: 'text-amber-600' },
                  { label: 'Rent Paid (Monthly)', value: fmt(data?.rent_paid_monthly), color: 'text-amber-600' },
                  { label: 'Health Insurance (Annual)', value: fmt(data?.health_insurance_premium), color: 'text-slate-800' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className={`text-sm font-medium ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assets & Investments */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-[#6366F1]" /> Assets &amp; Savings
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Current Savings', value: fmt(data?.current_savings), color: 'text-emerald-600' },
                  { label: 'Total Investments', value: fmt(data?.total_investments), color: 'text-emerald-600' },
                  { label: 'Monthly SIP', value: fmt(data?.monthly_sip), color: 'text-blue-600' },
                  { label: 'Emergency Fund', value: fmt(data?.emergency_fund), color: 'text-emerald-600' },
                  { label: '80C Investments', value: fmt(data?.deduction_80c), color: 'text-slate-800' },
                  { label: 'NPS (80CCD 1B)', value: fmt(data?.nps_80ccd), color: 'text-slate-800' },
                  { label: 'Expected Return', value: fmtPct(data?.expected_return), color: 'text-indigo-600' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500">{row.label}</span>
                    <span className={`text-sm font-medium ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insurance & Health Coverage */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <Shield className="w-4 h-4 text-[#10B981]" /> Insurance &amp; Health
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" />Term Life Insurance</span>
                  {bool(data?.has_term_insurance)}
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" />Health Insurance</span>
                  {bool(data?.has_health_insurance)}
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Clock className="w-3.5 h-3.5" />Emergency Coverage</span>
                  <span className={`text-sm font-medium ${emergencyColor(data?.emergency_months)}`}>
                    {emergencyLabel(data?.emergency_months)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" />Tax Regime Chosen</span>
                  {bool(data?.tax_regime_chosen)}
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" /> Liabilities
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'Home Loan EMI (Monthly)', value: fmt(data?.home_loan_emi), color: 'text-red-500', icon: <Home className="w-3.5 h-3.5" /> },
                  { label: 'Home Loan Interest (Annual)', value: fmt(data?.home_loan_interest_annual), color: 'text-red-500', icon: <Home className="w-3.5 h-3.5" /> },
                  { label: 'Credit Card Outstanding', value: fmt(data?.credit_card_debt), color: 'text-red-500', icon: <CreditCard className="w-3.5 h-3.5" /> },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <span className="text-sm text-slate-500 flex items-center gap-2">{row.icon}{row.label}</span>
                    <span className={`text-sm font-medium ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data completeness prompt */}
            <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5 flex flex-col sm:flex-row items-center gap-4">
              <PieChart className="w-8 h-8 text-indigo-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-indigo-800 mb-1">Want a deeper analysis?</p>
                <p className="text-xs text-indigo-600">Continue the AI chat to add your mutual fund portfolio for overlap analysis, expense ratio audit, and rebalancing suggestions.</p>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="shrink-0 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Add Portfolio →
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
