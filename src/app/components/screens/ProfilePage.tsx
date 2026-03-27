import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { supabase, type UserProfile } from '../../../lib/supabase';
import {
  User, Briefcase, Calendar, MapPin, Heart,
  Wallet, DollarSign, TrendingUp, Home, CreditCard, ShieldAlert,
  Edit3, ArrowRight, Loader2, Compass
} from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserProfile | null>(null);

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
          setData(p[0] as UserProfile);
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

  const fmt = (n: number | null | undefined) => n ? `₹${n.toLocaleString('en-IN')}` : '₹0';
  const fmtStr = (s: string | null | undefined) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Not specified';

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
            <p className="text-[#64748B]">Complete your profile by chatting with the AI mentor to unlock personalized insights.</p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors"
          >
            Update via Chat <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Categories Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          
          {/* Profile & Household */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <User className="w-5 h-5 text-[#6366F1]" /> Profile &amp; Household
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Employment</span>
                <span className="text-sm font-medium text-slate-800">{fmtStr(data?.employment_type)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Age</span>
                <span className="text-sm font-medium text-slate-800">
                  {data?.date_of_birth ? new Date().getFullYear() - new Date(data.date_of_birth).getFullYear() + ' yrs' : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> City Type</span>
                <span className="text-sm font-medium text-slate-800">{fmtStr(data?.city_type)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Heart className="w-4 h-4" /> Marital Status</span>
                <span className="text-sm font-medium text-slate-800">{fmtStr(data?.marital_status)}</span>
              </div>
            </div>
          </div>

          {/* Income Streams */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#10B981]" /> Income Streams
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Base Salary (Annual)</span>
                <span className="text-sm font-medium text-emerald-600">{fmt(data?.annual_income)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">HRA Received (Annual)</span>
                <span className="text-sm font-medium text-slate-800">{fmt(data?.hra_received)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Secondary Income (Monthly)</span>
                <span className="text-sm font-medium text-emerald-600">{fmt(data?.secondary_income_monthly)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Passive Income (Monthly)</span>
                <span className="text-sm font-medium text-emerald-600">{fmt(data?.passive_income_monthly)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#F59E0B]" /> Expenses
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Fixed Monthly Expenses</span>
                <span className="text-sm font-medium text-amber-600">{fmt(data?.monthly_expense)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Rent Paid (Monthly)</span>
                <span className="text-sm font-medium text-amber-600">{fmt(data?.rent_paid_monthly)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Health Insurance (Annual)</span>
                <span className="text-sm font-medium text-slate-800">{fmt(data?.health_insurance_premium)}</span>
              </div>
            </div>
          </div>

          {/* Assets & Investments */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#6366F1]" /> Assets &amp; Savings
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Emergency Fund</span>
                <span className="text-sm font-medium text-emerald-600">{fmt(data?.emergency_fund)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Current Savings &amp; MFs</span>
                <span className="text-sm font-medium text-emerald-600">{fmt(data?.current_savings)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">80C Investments</span>
                <span className="text-sm font-medium text-slate-800">{fmt(data?.deduction_80c)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">NPS (80CCD 1B)</span>
                <span className="text-sm font-medium text-slate-800">{fmt(data?.nps_80ccd)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm md:col-span-2 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#EF4444]" /> Liabilities
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Home Loan EMI</span>
                <span className="text-lg font-bold text-red-500">{fmt(data?.home_loan_emi)}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Home Loan Interest (Yr)</span>
                <span className="text-lg font-bold text-red-500">{fmt(data?.home_loan_interest_annual)}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Credit Card Debt</span>
                <span className="text-lg font-bold text-red-500">{fmt(data?.credit_card_debt)}</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
