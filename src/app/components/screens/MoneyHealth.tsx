import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ArrowLeft, RefreshCcw, Settings, CheckCircle2 } from 'lucide-react';
import {
  calculateHealthScore,
  type HealthInputs,
  type HealthResponse,
  type HealthDimensions,
} from '../../utils/finCalc';
import { CircularGauge } from '../shared/CircularGauge';
import { AIExplanationCard } from '../shared/AIExplanationCard';
import { ActionCard } from '../shared/ActionCard';

import { ExternalLink, Edit3, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

// ── Wizard Step config ──
const STEPS = [
  'Emergency',
  'Insurance',
  'Investments',
  'Debt',
  'Tax',
  'Retirement',
];

const DEFAULT_ANSWERS: HealthInputs = {
  emergency_months: '3-6',
  has_term_insurance: false,
  has_health_insurance: false,
  monthly_sip: 15000,
  total_investments: 500000,
  has_home_loan: false,
  monthly_emi: 0,
  tax_regime_optimized: false,
  annual_income: 1200000,
  epf_nps_contribution: 50000,
};

const dimensionLabels: Record<keyof HealthDimensions, string> = {
  emergency: 'Emergency Fund',
  insurance: 'Insurance',
  investments: 'Investments & Savings',
  debt: 'Debt Management',
  tax_efficiency: 'Tax Efficiency',
  retirement: 'Retirement Readiness',
};

const scoreColor = (s: number) => {
  if (s >= 80) return '#10B981'; // emerald-500
  if (s >= 60) return '#F59E0B'; // amber-500
  if (s >= 40) return '#F97316'; // orange-500
  return '#EF4444'; // red-500
};

export function MoneyHealth() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [step, setStep] = useState(0); // 0-5
  const [answers, setAnswers] = useState<HealthInputs>(DEFAULT_ANSWERS);
  const [result, setResult] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New States
  const [synced, setSynced] = useState(false);
  const [hasCompletedWizard, setHasCompletedWizard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile data or load from health_scores
  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if they already have a saved session
      try {
        const { data, error } = await supabase
          .from('health_scores')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data && !error) {
          const loadedAnswers: HealthInputs = {
            emergency_months: (data.emergency_months as any) || '3-6',
            has_term_insurance: data.has_term_insurance ?? false,
            has_health_insurance: data.has_health_insurance ?? false,
            monthly_sip: data.monthly_sip ?? 0,
            total_investments: data.total_investments ?? 0,
            has_home_loan: data.has_home_loan ?? false,
            monthly_emi: data.monthly_emi ?? 0,
            tax_regime_optimized: data.tax_regime_optimized ?? false,
            annual_income: data.annual_income ?? 0,
            epf_nps_contribution: data.epf_nps_contribution ?? 0,
          };
          setAnswers(loadedAnswers);
          setResult(calculateHealthScore(loadedAnswers));
          setHasCompletedWizard(true);
          setSynced(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('No previous health score found', e);
      }

      // No saved session found, sync from profile
      if (profile && !synced) {
        setAnswers((prev) => ({
          ...prev,
          has_term_insurance: profile.has_term_insurance ?? prev.has_term_insurance,
          has_health_insurance: profile.has_health_insurance ?? prev.has_health_insurance,
          total_investments: profile.current_savings ?? prev.total_investments,
          monthly_emi: profile.home_loan_emi ?? prev.monthly_emi,
          has_home_loan: Number(profile.home_loan_emi) > 0 ? true : prev.has_home_loan,
          annual_income: profile.annual_income ?? prev.annual_income,
        }));
        setSynced(true);
      }
      setLoading(false);
    }
    loadData();
  }, [user, profile, synced]);

  const isProfileIncomplete = !profile || profile.annual_income == null || profile.current_savings == null || profile.monthly_expense == null;

  const set = (k: keyof HealthInputs) => (val: any) => setAnswers((p) => ({ ...p, [k]: val }));
  const setNum = (k: keyof HealthInputs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k)(Number(e.target.value));

  const saveToDB = async (scoreResult: HealthResponse) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await supabase.from('health_scores').upsert({
        user_id: user.id,
        overall_score: scoreResult.overall_score,
        emergency_score: scoreResult.dimensions.emergency,
        insurance_score: scoreResult.dimensions.insurance,
        investment_score: scoreResult.dimensions.investments,
        debt_score: scoreResult.dimensions.debt,
        tax_score: scoreResult.dimensions.tax_efficiency,
        retirement_score: scoreResult.dimensions.retirement,
        
        emergency_months: answers.emergency_months,
        has_term_insurance: answers.has_term_insurance,
        has_health_insurance: answers.has_health_insurance,
        monthly_sip: answers.monthly_sip,
        total_investments: answers.total_investments,
        has_home_loan: answers.has_home_loan,
        monthly_emi: answers.monthly_emi,
        tax_regime_optimized: answers.tax_regime_optimized,
        annual_income: answers.annual_income,
        epf_nps_contribution: answers.epf_nps_contribution,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.error('Failed to save health score', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      setLoading(true);
      setTimeout(() => {
        const res = calculateHealthScore(answers);
        setResult(res);
        setHasCompletedWizard(true);
        saveToDB(res);
        setLoading(false);
      }, 800);
    }
  };

  const handleRecheckScore = async () => {
    const res = calculateHealthScore(answers);
    setResult(res);
    await saveToDB(res);
  };

  const handleBack = () => {
    if (result && !hasCompletedWizard) {
      setResult(null);
      setStep(5);
    } else {
      setStep((s) => Math.max(0, s - 1));
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(0);
    setAnswers(DEFAULT_ANSWERS);
    setHasCompletedWizard(false);
    setSynced(false);
  };

  const btnOpt = (active: boolean) =>
    `w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
      active
        ? 'bg-[#6366F1] border-[#6366F1] text-white'
        : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1] hover:bg-[#EEF2FF]'
    }`;

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-sm focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20';
  const labelClass = 'block text-[#374151] text-sm font-medium mb-1.5';

  const ctaRoutes: Partial<Record<keyof HealthDimensions, string>> = {
    retirement: '/fire',
    tax_efficiency: '/tax',
    investments: '/portfolio',
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#64748B] text-sm">Analyzing your financial health...</p>
      </div>
    );
  }

  // ── Result view (30:70 Dashboard) ──
  if (hasCompletedWizard && result) {
    const gradeVariant =
      result.grade === 'Excellent'
        ? 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]'
        : result.grade === 'Good'
        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
        : result.grade === 'Fair'
        ? 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]'
        : 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]';

    return (
      <div className="p-4 md:p-8 flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto">
        
        {/* LEFT COLUMN: 30% Width Form (Row Wise) */}
        <div className="lg:w-1/3 flex-shrink-0 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm h-fit sticky top-6 custom-scrollbar overflow-y-auto max-h-[85vh]">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#6366F1]"/> Health Inputs
             </h3>
             <button
               onClick={handleReset}
               className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
               title="Reset Wizard"
             >
               <RefreshCcw className="w-4 h-4" />
             </button>
          </div>

          <div className="space-y-5">
            {/* Step 0 - Emergency */}
            <div>
              <label className={labelClass}>Emergency Fund (Months)</label>
              <select 
                className={inputClass}
                value={answers.emergency_months}
                onChange={(e) => set('emergency_months')(e.target.value)}
              >
                <option value="<1">Less than 1 month</option>
                <option value="1-3">1–3 months</option>
                <option value="3-6">3–6 months</option>
                <option value=">6">More than 6 months</option>
              </select>
            </div>

            {/* Step 1 - Insurance */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Term Insurance</label>
                <div className="flex gap-2">
                  <button onClick={() => set('has_term_insurance')(true)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${answers.has_term_insurance ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}>Yes</button>
                  <button onClick={() => set('has_term_insurance')(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${!answers.has_term_insurance ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}>No</button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Health Insurance</label>
                <div className="flex gap-2">
                  <button onClick={() => set('has_health_insurance')(true)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${answers.has_health_insurance ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}>Yes</button>
                  <button onClick={() => set('has_health_insurance')(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${!answers.has_health_insurance ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}>No</button>
                </div>
              </div>
            </div>

            {/* Step 2 - Investments */}
            <div>
              <label className={labelClass}>Monthly SIP (₹)</label>
              <input type="number" value={answers.monthly_sip} onChange={setNum('monthly_sip')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Total Investments (₹)</label>
              <input type="number" value={answers.total_investments} onChange={setNum('total_investments')} className={inputClass} />
            </div>

            {/* Step 3 - Debt */}
            <div>
              <label className={labelClass}>Have Home Loan?</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => set('has_home_loan')(true)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${answers.has_home_loan ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}>Yes</button>
                <button onClick={() => set('has_home_loan')(false)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${!answers.has_home_loan ? 'bg-[#6366F1] text-white border-[#6366F1]' : 'bg-white text-[#64748B] border-[#E2E8F0]'}`}>No</button>
              </div>
              {answers.has_home_loan && (
                <div>
                  <label className={labelClass}>Monthly EMI (₹)</label>
                  <input type="number" value={answers.monthly_emi} onChange={setNum('monthly_emi')} className={inputClass} />
                </div>
              )}
            </div>

            {/* Step 4 - Tax */}
            <div>
              <label className={labelClass}>Tax Regime Chosen</label>
              <select 
                className={inputClass}
                value={answers.tax_regime_optimized ? 'yes' : 'no'}
                onChange={(e) => set('tax_regime_optimized')(e.target.value === 'yes')}
              >
                <option value="yes">Optimized (Used FinPilot Tax Tool)</option>
                <option value="no">Not Optimized / Unsure</option>
              </select>
            </div>

            {/* Income & Retirement */}
            <div>
              <label className={labelClass}>Annual Income (₹)</label>
              <input type="number" value={answers.annual_income} onChange={setNum('annual_income')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Annual EPF/NPS (₹)</label>
              <input type="number" value={answers.epf_nps_contribution} onChange={setNum('epf_nps_contribution')} className={inputClass} />
            </div>
          </div>

          <button
            onClick={handleRecheckScore}
            disabled={isSaving}
            className="w-full mt-6 py-3 rounded-xl bg-[#0F172A] text-white text-sm font-semibold hover:bg-[#1E293B] transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Recheck Score'}
          </button>
        </div>

        {/* RIGHT COLUMN: 70% Width Result */}
        <div className="lg:w-2/3 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#0F172A] font-bold text-2xl">Money Health Score</h2>
              <p className="text-[#64748B] text-sm mt-1">Your financial wellness report</p>
            </div>
          </div>

          {isProfileIncomplete && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex gap-3 text-sm">
              <span className="text-xl leading-none">⚠️</span>
              <div>
                <p className="font-semibold text-[#B45309]">Incomplete Profile</p>
                <p className="text-[#D97706] mt-0.5">Your profile may be missing key details. Update your dashboard inputs to ensure the most precise analysis.</p>
              </div>
            </div>
          )}

          {/* Score + Grade */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 flex flex-col items-center">
            <CircularGauge score={result.overall_score} />
            <span className={`mt-2 px-4 py-1.5 rounded-full border text-sm font-semibold ${gradeVariant}`}>
              {result.grade} — Room to improve
            </span>
          </div>

          {/* Dimension Cards */}
          <div>
            <h3 className="text-[#0F172A] font-semibold text-base mb-3">Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.entries(result.dimensions) as [keyof HealthDimensions, number][]).map(([key, val]) => (
                <div key={key} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#374151] text-sm font-medium">{dimensionLabels[key]}</span>
                    <span className="text-sm font-bold" style={{ color: scoreColor(val) }}>
                      {val}/100
                    </span>
                  </div>
                  <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${val}%`, background: scoreColor(val) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Actions */}
          <div>
            <h3 className="text-[#0F172A] font-semibold text-base mb-3">Priority Actions</h3>
            <div className="flex flex-col md:flex-row gap-3">
              {result.priority_actions.map((action) => (
                <ActionCard
                  key={action.dimension}
                  severity={action.severity}
                  title={action.title}
                  description={action.description}
                  ctaLabel={action.cta}
                  onCtaClick={() => {
                    const route = ctaRoutes[action.dimension];
                    if (route) navigate(route);
                  }}
                />
              ))}
            </div>
          </div>

          {/* AI Card */}
          <AIExplanationCard text={result.reasoning} />
        </div>

      </div>
    );
  }

  // ── First Time Wizard ──
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-1 flex-wrap">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`text-xs font-medium ${i <= step ? 'text-[#6366F1]' : 'text-[#94A3B8]'}`}
              >
                {s}{i < STEPS.length - 1 ? ' ·' : ''}
              </span>
            ))}
          </div>
          <span className="text-[#64748B] text-xs font-medium">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#6366F1] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {isProfileIncomplete && step === 0 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex gap-3 text-sm">
          <span className="text-xl leading-none">⚠️</span>
          <div>
            <p className="font-semibold text-[#B45309]">Heads Up: Incomplete Profile</p>
            <p className="text-[#D97706] mt-0.5">We noticed your profile is not fully completed. To get an accurate Money Health score, please ensure the answers provided in these steps are correct, or consider completing your profile in the Chat first.</p>
          </div>
        </div>
      )}

      {/* Step Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
        {/* Step 0 — Emergency Fund */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Emergency Fund</h3>
              <p className="text-[#64748B] text-sm mt-1">How many months of expenses can you cover without income?</p>
            </div>
            <div className="space-y-2.5 mt-4">
              {([['<1', 'Less than 1 month'], ['1-3', '1–3 months'], ['3-6', '3–6 months'], ['>6', 'More than 6 months']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => set('emergency_months')(val)}
                  className={btnOpt(answers.emergency_months === val)}
                >
                  <span className="flex items-center justify-between">
                    {label}
                    {answers.emergency_months === val && <span>✓</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1 — Insurance */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Insurance</h3>
              <p className="text-[#64748B] text-sm mt-1">Do you have adequate insurance coverage?</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">Do you have term life insurance?</p>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => set('has_term_insurance')(v === 'Yes')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        answers.has_term_insurance === (v === 'Yes')
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">Do you have health insurance?</p>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => set('has_health_insurance')(v === 'Yes')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        answers.has_health_insurance === (v === 'Yes')
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Investments */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Investments</h3>
              <p className="text-[#64748B] text-sm mt-1">Tell us about your savings and investments.</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <label className={labelClass}>Monthly SIP / Regular Savings (₹)</label>
                <input
                  type="number"
                  value={answers.monthly_sip || ''}
                  onChange={setNum('monthly_sip')}
                  className={inputClass}
                  placeholder="e.g. 15000"
                />
              </div>
              <div>
                <label className={labelClass}>Total Investments Portfolio (₹)</label>
                <input
                  type="number"
                  value={answers.total_investments || ''}
                  onChange={setNum('total_investments')}
                  className={inputClass}
                  placeholder="e.g. 500000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Debt */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Debt</h3>
              <p className="text-[#64748B] text-sm mt-1">Let us assess your debt situation.</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">Do you have a home loan?</p>
                <div className="flex gap-2">
                  {(['Yes', 'No'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => set('has_home_loan')(v === 'Yes')}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        answers.has_home_loan === (v === 'Yes')
                          ? 'bg-[#6366F1] border-[#6366F1] text-white'
                          : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {answers.has_home_loan && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className={labelClass}>Total Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={answers.monthly_emi || ''}
                    onChange={setNum('monthly_emi')}
                    className={inputClass}
                    placeholder="e.g. 30000"
                  />
                </div>
              )}
              
              {/* CIBIL Score action block */}
              <div className="mt-8 pt-4 border-t border-[#F1F5F9]">
                <div className="flex items-start justify-between bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl">
                  <div>
                    <h4 className="text-[#0F172A] font-semibold text-sm">Know your exact debt standing?</h4>
                    <p className="text-[#64748B] text-xs mt-1 leading-relaxed">Checking your credit score regularly doesn't impact it, but it helps identify loan eligibility and bad marks.</p>
                  </div>
                  <a
                    href="https://www.cibil.com/freecibilscore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#CBD5E1] text-[#374151] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9] transition-colors whitespace-nowrap"
                  >
                    Check CIBIL <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Tax */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Tax Efficiency</h3>
              <p className="text-[#64748B] text-sm mt-1">Are you optimizing your tax outflow?</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <label className={labelClass}>Annual Income (₹)</label>
                <input
                  type="number"
                  value={answers.annual_income || ''}
                  onChange={setNum('annual_income')}
                  className={inputClass}
                  placeholder="e.g. 1500000"
                />
              </div>
              <div>
                <p className="text-[#374151] text-sm font-medium mb-2">Have you optimized your tax regime?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => set('tax_regime_optimized')(true)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      answers.tax_regime_optimized === true
                        ? 'bg-[#6366F1] border-[#6366F1] text-white'
                        : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                    }`}
                  >
                    Yes, done analysis
                  </button>
                  <button
                    onClick={() => set('tax_regime_optimized')(false)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      answers.tax_regime_optimized === false
                        ? 'bg-[#6366F1] border-[#6366F1] text-white'
                        : 'bg-white border-[#E2E8F0] text-[#374151] hover:border-[#6366F1]'
                    }`}
                  >
                    No / Not sure
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Retirement */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[#0F172A] font-bold text-xl">Retirement</h3>
              <p className="text-[#64748B] text-sm mt-1">Tell us about your long-term security.</p>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <label className={labelClass}>Annual EPF/NPS Contribution (₹)</label>
                <input
                  type="number"
                  value={answers.epf_nps_contribution || ''}
                  onChange={setNum('epf_nps_contribution')}
                  className={inputClass}
                  placeholder="e.g. 90000 (Employer + Employee)"
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-[#F1F5F9]">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-medium hover:bg-[#F8FAFC] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0F172A] text-white font-medium hover:bg-[#1E293B] transition-colors"
          >
            {step === 5 ? 'Get My Score' : 'Next Step'}
            {step < 5 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
