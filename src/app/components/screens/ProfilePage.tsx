import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  User, Briefcase, Calendar, MapPin, Heart,
  Wallet, DollarSign, TrendingUp, Home, CreditCard, ShieldAlert,
  ArrowRight, Loader2, Compass, Shield, PieChart, AlertTriangle,
  CheckCircle2, XCircle, Clock, Edit3, Save, X
} from 'lucide-react';

const bool = (v: boolean | null | undefined) =>
  v === true ? <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium"><CheckCircle2 className="w-4 h-4" />Yes</span>
  : v === false ? <span className="flex items-center gap-1 text-red-500 text-sm font-medium"><XCircle className="w-4 h-4" />No</span>
  : <span className="text-slate-400 text-sm">—</span>;

const EditableRow = ({ label, icon, field, valueStr, colorClass = "text-slate-800", type = "number", options = [], isBool = false, isEditing, data, editData, setEditData }: any) => {
  if (!isEditing) {
    return (
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <span className="text-sm text-slate-500 flex items-center gap-2">{icon}{label}</span>
        {isBool ? bool(data?.[field]) : <span className={`text-sm font-medium ${colorClass}`}>{valueStr}</span>}
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="flex flex-col justify-between items-start pb-3 border-b border-slate-100 gap-1.5">
      <span className="text-sm text-slate-500 flex items-center gap-2">{icon}{label}</span>
      {type === 'select' ? (
        <select
          value={editData[field] || ''}
          onChange={(e) => setEditData({...editData, [field]: e.target.value === '' ? null : e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
        >
          <option value="">Select...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'boolean' ? (
        <select
          value={editData[field] === true ? 'true' : editData[field] === false ? 'false' : ''}
          onChange={(e) => setEditData({...editData, [field]: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null})}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
        >
          <option value="">Select...</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      ) : (
        <input
          type={type}
          value={editData[field] ?? ''}
          onChange={(e) => setEditData({...editData, [field]: type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value})}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-all"
          placeholder={`Enter ${label.toLowerCase()}`}
          step={type === 'number' ? 'any' : undefined}
        />
      )}
    </div>
  );
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);

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
          setEditData(p[0]);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...editData };
      // Sanitize data before sending to Supabase
      for (const key in payload) {
        if (payload[key] === '') payload[key] = null;
        if (typeof payload[key] === 'number' && Number.isNaN(payload[key])) payload[key] = null;
      }
      
      const { error } = await supabase.from('user_profiles').upsert({
        ...payload,
        user_id: user!.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
      if (!error) {
        setData(editData);
        setIsEditing(false);
        // Clear chat cache so it uses the updated profile
        sessionStorage.removeItem('finpilot_wizard_data');
        await refreshProfile();
      } else {
        console.error('Save failed', error);
      }
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditData(data || {});
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  const fmt = (n: number | null | undefined) => (n !== null && n !== undefined && !isNaN(n)) ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
  const fmtStr = (s: string | null | undefined) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '—';
  const fmtPct = (n: number | null | undefined) => (n !== null && n !== undefined) ? `${(Number(n) <= 1 ? Number(n) * 100 : Number(n)).toFixed(1)}%` : '—';

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

  const noData = !data && Object.keys(editData).length === 0;

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
              {noData && !isEditing
                ? 'No data yet — complete the AI chat to build your profile.'
                : 'Your complete financial picture, collected via AI chat.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {!noData && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl font-medium hover:bg-slate-50 hover:border-[#CBD5E1] transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10B981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors disabled:opacity-70"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            )}
            {!isEditing && (
              <button
                onClick={() => navigate('/chat')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors shadow-sm"
              >
                {noData ? 'Start AI Chat' : 'Go to Chat'} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {noData && !isEditing ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#6366F1] p-12 text-center">
            <Compass className="w-12 h-12 text-[#6366F1] mx-auto mb-4 opacity-40" />
            <h2 className="text-lg font-semibold text-slate-700 mb-2">No profile data yet</h2>
            <p className="text-slate-500 mb-6">Start an AI chat to build your Tax, FIRE & Money Health profile automatically.</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/chat')} className="px-6 py-2.5 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors shadow-sm">
                Start Chat →
              </button>
              <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-white text-[#6366F1] border border-[#C7D2FE] rounded-xl font-medium hover:bg-[#EEF2FF] transition-colors">
                Enter Details Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">

            {/* Profile & Household */}
            <div className={`bg-white rounded-2xl border ${isEditing ? 'border-[#6366F1] ring-1 ring-[#6366F1]/10' : 'border-[#E2E8F0]'} p-6 shadow-sm`}>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <User className="w-4 h-4 text-[#6366F1]" /> Profile &amp; Household
              </h2>
              <div className="space-y-3">
                <EditableRow
                  label="Employment" icon={<Briefcase className="w-3.5 h-3.5" />} field="employment_type" valueStr={fmtStr(data?.employment_type)} type="select"
                  options={[
                    { label: 'Salaried', value: 'salaried' },
                    { label: 'Self-Employed', value: 'self-employed' },
                    { label: 'Student', value: 'student' },
                    { label: 'Unemployed', value: 'unemployed' },
                    { label: 'Retired', value: 'retired' },
                  ]}
                />
                <EditableRow
                  label="Date of Birth" icon={<Calendar className="w-3.5 h-3.5" />} field="date_of_birth"
                  valueStr={data?.date_of_birth ? (new Date().getFullYear() - new Date(data.date_of_birth).getFullYear()) + ' yrs' : '—'} type="date"
                />
                <EditableRow
                  label="City Type" icon={<MapPin className="w-3.5 h-3.5" />} field="city_type" valueStr={fmtStr(data?.city_type)} type="select"
                  options={[
                    { label: 'Metro', value: 'metro' },
                    { label: 'Non-Metro', value: 'non-metro' },
                    { label: 'Rural', value: 'rural' },
                  ]}
                />
                <EditableRow
                  label="Marital Status" icon={<Heart className="w-3.5 h-3.5" />} field="marital_status" valueStr={fmtStr(data?.marital_status)} type="select"
                  options={[
                    { label: 'Single', value: 'single' },
                    { label: 'Married', value: 'married' },
                  ]}
                />
              </div>
            </div>

            {/* Income Streams */}
            <div className={`bg-white rounded-2xl border ${isEditing ? 'border-[#6366F1] ring-1 ring-[#6366F1]/10' : 'border-[#E2E8F0]'} p-6 shadow-sm`}>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <Wallet className="w-4 h-4 text-[#10B981]" /> Income Streams
              </h2>
              <div className="space-y-3">
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Base Salary (Annual)" icon={<Wallet className="w-3.5 h-3.5 opacity-0" />} field="annual_income" valueStr={fmt(data?.annual_income)} colorClass="text-emerald-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="HRA Received (Annual)" icon={<Wallet className="w-3.5 h-3.5 opacity-0" />} field="hra_received" valueStr={fmt(data?.hra_received)} />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="EPF (Monthly)" icon={<Wallet className="w-3.5 h-3.5 opacity-0" />} field="epf_monthly" valueStr={fmt(data?.epf_monthly)} />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Secondary Income (Monthly)" icon={<Wallet className="w-3.5 h-3.5 opacity-0" />} field="secondary_income_monthly" valueStr={fmt(data?.secondary_income_monthly)} colorClass="text-emerald-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Passive Income (Monthly)" icon={<Wallet className="w-3.5 h-3.5 opacity-0" />} field="passive_income_monthly" valueStr={fmt(data?.passive_income_monthly)} colorClass="text-emerald-600" />
              </div>
            </div>

            {/* Expenses */}
            <div className={`bg-white rounded-2xl border ${isEditing ? 'border-[#6366F1] ring-1 ring-[#6366F1]/10' : 'border-[#E2E8F0]'} p-6 shadow-sm`}>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <DollarSign className="w-4 h-4 text-[#F59E0B]" /> Expenses
              </h2>
              <div className="space-y-3">
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Fixed Monthly" icon={<DollarSign className="w-3.5 h-3.5 opacity-0" />} field="monthly_expense" valueStr={fmt(data?.monthly_expense)} colorClass="text-amber-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Rent Paid (Monthly)" icon={<DollarSign className="w-3.5 h-3.5 opacity-0" />} field="rent_paid_monthly" valueStr={fmt(data?.rent_paid_monthly)} colorClass="text-amber-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Health Insurance (Annual)" icon={<DollarSign className="w-3.5 h-3.5 opacity-0" />} field="health_insurance_premium" valueStr={fmt(data?.health_insurance_premium)} />
              </div>
            </div>

            {/* Assets & Investments */}
            <div className={`bg-white rounded-2xl border ${isEditing ? 'border-[#6366F1] ring-1 ring-[#6366F1]/10' : 'border-[#E2E8F0]'} p-6 shadow-sm`}>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-[#6366F1]" /> Assets &amp; Savings
              </h2>
              <div className="space-y-3">
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Current Savings" icon={<TrendingUp className="w-3.5 h-3.5 opacity-0" />} field="current_savings" valueStr={fmt(data?.current_savings)} colorClass="text-emerald-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Total Investments" icon={<TrendingUp className="w-3.5 h-3.5 opacity-0" />} field="total_investments" valueStr={fmt(data?.total_investments)} colorClass="text-emerald-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Monthly SIP" icon={<TrendingUp className="w-3.5 h-3.5 opacity-0" />} field="monthly_sip" valueStr={fmt(data?.monthly_sip)} colorClass="text-blue-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Emergency Fund" icon={<TrendingUp className="w-3.5 h-3.5 opacity-0" />} field="emergency_fund" valueStr={fmt(data?.emergency_fund)} colorClass="text-emerald-600" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="80C Investments" icon={<TrendingUp className="w-3.5 h-3.5 opacity-0" />} field="deduction_80c" valueStr={fmt(data?.deduction_80c)} />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="NPS (80CCD 1B)" icon={<TrendingUp className="w-3.5 h-3.5 opacity-0" />} field="nps_80ccd" valueStr={fmt(data?.nps_80ccd)} />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Expected Return (Decimal, e.g. 0.12)" icon={<TrendingUp className="w-3.5 h-3.5 opacity-0" />} field="expected_return" valueStr={fmtPct(data?.expected_return)} colorClass="text-indigo-600" />
              </div>
            </div>

            {/* Insurance & Health Coverage */}
            <div className={`bg-white rounded-2xl border ${isEditing ? 'border-[#6366F1] ring-1 ring-[#6366F1]/10' : 'border-[#E2E8F0]'} p-6 shadow-sm`}>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <Shield className="w-4 h-4 text-[#10B981]" /> Insurance &amp; Health
              </h2>
              <div className="space-y-3">
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Term Life Insurance" icon={<CheckCircle2 className="w-3.5 h-3.5" />} field="has_term_insurance" isBool={true} type="boolean" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Health Insurance" icon={<CheckCircle2 className="w-3.5 h-3.5" />} field="has_health_insurance" isBool={true} type="boolean" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Emergency Coverage" icon={<Clock className="w-3.5 h-3.5" />} field="emergency_months" valueStr={emergencyLabel(data?.emergency_months)}
                  colorClass={emergencyColor(data?.emergency_months)} type="select"
                  options={[
                    { label: '< 1 month', value: '<1' },
                    { label: '1–3 months', value: '1-3' },
                    { label: '3–6 months', value: '3-6' },
                    { label: '6+ months', value: '>6' },
                  ]}
                />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Tax Regime Chosen" icon={<CheckCircle2 className="w-3.5 h-3.5" />} field="tax_regime_chosen" isBool={true} type="boolean" />
              </div>
            </div>

            {/* Liabilities */}
            <div className={`bg-white rounded-2xl border ${isEditing ? 'border-[#6366F1] ring-1 ring-[#6366F1]/10' : 'border-[#E2E8F0]'} p-6 shadow-sm`}>
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 mb-5">
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" /> Liabilities
              </h2>
              <div className="space-y-3">
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Home Loan EMI (Monthly)" icon={<Home className="w-3.5 h-3.5" />} field="home_loan_emi" valueStr={fmt(data?.home_loan_emi)} colorClass="text-red-500" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Home Loan Interest (Annual)" icon={<Home className="w-3.5 h-3.5" />} field="home_loan_interest_annual" valueStr={fmt(data?.home_loan_interest_annual)} colorClass="text-red-500" />
                <EditableRow isEditing={isEditing} data={data} editData={editData} setEditData={setEditData} label="Credit Card Outstanding" icon={<CreditCard className="w-3.5 h-3.5" />} field="credit_card_debt" valueStr={fmt(data?.credit_card_debt)} colorClass="text-red-500" />
              </div>
            </div>

            {/* Data completeness prompt */}
            {!isEditing && (
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
            )}

          </div>
        )}
      </main>
    </div>
  );
}
