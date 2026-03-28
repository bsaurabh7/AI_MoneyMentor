import { useState, useRef, useEffect } from 'react';
import { Send, Mic, RefreshCcw, Bot } from 'lucide-react';
import { useChatBot } from '../../hooks/useChatBot';
import { BotBubble, UserBubble, TypingIndicator } from '../chat/ChatBubble';
import { ChatTaxCard } from '../chat/ChatTaxCard';
import { ChatFireCard } from '../chat/ChatFireCard';
import { SummaryPanel } from '../chat/SummaryPanel';
import { ChatSIPCard } from '../chat/ChatSIPCard';
import { ChatInsuranceCard } from '../chat/ChatInsuranceCard';
import { ChatLoanCard } from '../chat/ChatLoanCard';
import { ChatExpenseCard } from '../chat/ChatExpenseCard';
import { ProfileWizard } from '../onboarding/ProfileWizard';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { supabase } from '../../../lib/supabase';
import type { CollectedData } from '../../hooks/useCollectedData';
import { Loader2 } from 'lucide-react';

const FREE_KEY = 'fp_free_used';

export function ChatScreen() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [input, setInput] = useState('');
  const [wizardData, setWizardData] = useState<CollectedData | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Magic Data Reset URL param
  useEffect(() => {
    // ... no changes here
    const params = new URLSearchParams(window.location.search);
    if (params.get('RemoveData') === 'true' && user) {
      Promise.all([
        supabase.from('user_profiles').delete().eq('user_id', user.id),
        supabase.from('tax_calculations').delete().eq('user_id', user.id),
        supabase.from('fire_plans').delete().eq('user_id', user.id),
        supabase.from('health_scores').delete().eq('user_id', user.id),
        supabase.from('portfolio_funds').delete().eq('user_id', user.id),
        supabase.from('portfolio_analysis').delete().eq('user_id', user.id),
      ]).then(() => {
        alert('Success! All your financial data has been erased from the database.');
        window.location.href = '/chat';
      });
    }
  }, [user]);

  // Populate wizardData from global profile if it exists
  useEffect(() => {
    // Try to load from session storage first to preserve precise progress state
    const cached = sessionStorage.getItem('finpilot_wizard_data');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Object.keys(parsed).length > 0 && !wizardData) {
          setWizardData(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse cached wizard data', e);
      }
    }

    if (user && profile && profile.annual_income) {
      const p = profile as any;
      const mapped: CollectedData = {
        demographics: {
          age: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : undefined,
          city_type: p.city_type || undefined,
          employment_type: p.employment_type || undefined,
          marital_status: p.marital_status || undefined,
        },
        income: {
          base_salary: p.annual_income ?? undefined,
          hra_received: p.hra_received || 0,
          secondary_income_monthly: p.secondary_income_monthly || 0,
          passive_income_monthly: p.passive_income_monthly || 0,
          epf_monthly: p.epf_monthly || 0,
        },
        expenses: {
          fixed_monthly: p.monthly_expense || 0,
          rent_paid_monthly: p.rent_paid_monthly || 0,
          health_insurance_premium: p.health_insurance_premium || 0,
        },
        assets: {
          emergency_fund: p.emergency_fund || 0,
          current_savings: p.current_savings || 0,
          deduction_80c: p.deduction_80c || 0,
          deduction_80d: p.deduction_80d || 0,
          nps_80ccd: p.nps_80ccd || 0,
          monthly_sip: p.monthly_sip || 0,
          total_investments: p.total_investments || 0,
          has_term_insurance: p.has_term_insurance ?? undefined,
          has_health_insurance: p.has_health_insurance ?? undefined,
          emergency_months: p.emergency_months ?? undefined,
          expected_return: p.expected_return || 0.12,
          tax_regime_chosen: p.tax_regime_chosen ?? undefined,
        },
        liabilities: {
          home_loan_emi: p.home_loan_emi || 0,
          home_loan_interest_annual: p.home_loan_interest_annual || 0,
          credit_card_debt: p.credit_card_debt || 0,
        }
      };
      // Only set wizardData from profile if we don't already have live wizardData
      setWizardData(prev => prev || mapped);
    }
  }, [user, profile]);

  const [hasUsedFree, setHasUsedFree] = useState(false);
  useEffect(() => {
    if (!user && localStorage.getItem(FREE_KEY)) setHasUsedFree(true);
  }, [user]);

  const showWizard = !authLoading && wizardData === null && !hasUsedFree;

  const { messages, sendMessage, isTyping, step, collected, taxResult, fireResult, progress, quickReplies, askAgent } =
    useChatBot(wizardData ?? undefined);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  useEffect(() => {
    if (!user && taxResult && !hasUsedFree) {
      localStorage.setItem(FREE_KEY, Date.now().toString());
      setHasUsedFree(true);
    }
  }, [taxResult, user, hasUsedFree]);

  const showGuestBlur = !user && hasUsedFree && taxResult;

  const handleSend = () => { if (!input.trim() || isTyping) return; sendMessage(input.trim()); setInput(''); inputRef.current?.focus(); };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleQuickReply = (text: string) => { if (isTyping) return; sendMessage(text); };

  const handleWizardComplete = async (data: CollectedData) => {
    setWizardData(data);
    if (user) {
      // Generate a DOY string if age is given to fake date of birth for context, since profile demands Date natively.
      const dobStr = data.demographics?.age 
        ? `${new Date().getFullYear() - data.demographics.age}-01-01` 
        : undefined;
      
      try {
        const sNum = (n: any) => (typeof n === 'number' && !Number.isNaN(n) ? n : 0);
        const sStr = (s: any) => (typeof s === 'string' && s.trim() !== '' ? s : null);

        await supabase.from('user_profiles').upsert({
          user_id: user.id,
          date_of_birth: dobStr || null,
          city_type: sStr(data.demographics?.city_type),
          employment_type: sStr(data.demographics?.employment_type),
          marital_status: sStr(data.demographics?.marital_status),
          annual_income: sNum(data.income?.base_salary),
          hra_received: sNum(data.income?.hra_received),
          monthly_expense: sNum(data.expenses?.fixed_monthly),
          rent_paid_monthly: sNum(data.expenses?.rent_paid_monthly),
          deduction_80c: sNum(data.assets?.deduction_80c),
          nps_80ccd: sNum(data.assets?.nps_80ccd),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        
        await refreshProfile();
      } catch (err) {
        console.error("Popup sync failed", err);
      }
    }
  };

  return (
    <div className="flex h-full relative" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Loading Overlay ─────────────────────────────────────── */}
      {authLoading && (
        <div className="absolute inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin mb-4" />
          <p className="text-[#64748B] font-medium">Checking session...</p>
        </div>
      )}

      {/* ── Profile Wizard Overlay ──────────────────────────────── */}
      {showWizard && <ProfileWizard onComplete={handleWizardComplete} />}

      {/* ── Guest Exhausted Screen (Before Wizard) ──────────────── */}
      {!user && hasUsedFree && !taxResult && !wizardData && (
        <div className="absolute inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-[#EEF2FF] text-[#6366F1] rounded-2xl flex items-center justify-center mb-6">
            <Bot className="w-8 h-8" />
          </div>
          <h2 className="text-[#0F172A] text-2xl font-bold mb-3">Welcome back!</h2>
          <p className="text-[#64748B] max-w-sm mb-8">
            You've used your free AI analysis. Sign in to your account to review your profile and unlock the FIRE planner.
          </p>
          <div className="flex gap-4">
            <button onClick={() => { setAuthTab('login'); setAuthOpen(true); }} className="px-6 py-2.5 rounded-xl border border-[#E2E8F0] font-medium text-[#0F172A] hover:bg-slate-50 transition-colors">
              Login
            </button>
            <button onClick={() => { setAuthTab('register'); setAuthOpen(true); }} className="px-6 py-2.5 rounded-xl bg-[#6366F1] font-medium text-white hover:bg-[#4F46E5] transition-colors">
              Sign Up Free
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Panel ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-[#E2E8F0] bg-white lg:max-w-[560px]">
        {/* Chat Top Bar */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2E8F0] flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#6366F1] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[#0F172A] font-bold text-sm leading-tight">FinPilot AI</p>
              <p className="text-[#94A3B8] text-xs leading-tight">Tax &amp; FIRE Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
              <span className="text-[#4338CA] text-xs font-medium">{progress}% profile</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-[#94A3B8] hover:text-[#6366F1] transition-colors"
              title="Start over"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8FAFC]">
          {messages.map((msg) => {
            if (msg.role === 'user') return <UserBubble key={msg.id} content={msg.content} />;
            if (msg.type === 'typing') return <TypingIndicator key={msg.id} />;
            if (msg.type === 'text') return <BotBubble key={msg.id} content={msg.content} />;
            if (msg.type === 'tax_result') return <ChatTaxCard key={msg.id} data={msg.data} />;
            if (msg.type === 'fire_result') return <ChatFireCard key={msg.id} data={msg.data} retireAge={msg.retireAge} />;
            if (msg.type === 'agent_result') {
              if (msg.agentType === 'sip') return <ChatSIPCard key={msg.id} data={msg.data} />;
              if (msg.agentType === 'insurance') return <ChatInsuranceCard key={msg.id} data={msg.data} />;
              if (msg.agentType === 'loan') return <ChatLoanCard key={msg.id} data={msg.data} />;
              if (msg.agentType === 'expenses') return <ChatExpenseCard key={msg.id} data={msg.data} />;
              return null;
            }
            return null;
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar (disabled with blur if guest used feature) */}
        <div className="relative">
          {showGuestBlur && (
            <div className="absolute inset-x-0 bottom-full h-48 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
          )}
          
          {showGuestBlur && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center border-t border-[#E2E8F0]">
              <p className="text-[#0F172A] font-bold text-sm mb-2">Sign in to continue chat 🔒</p>
              <button
                onClick={() => { setAuthTab('register'); setAuthOpen(true); }}
                className="px-5 py-2 rounded-full bg-[#6366F1] text-white text-xs font-bold hover:bg-[#4F46E5] shadow-sm"
              >
                Create Free Account
              </button>
            </div>
          )}

          {/* Quick Reply Chips */}
          {step !== 'done' && quickReplies.length > 0 && !showGuestBlur && (
            <div className="px-4 py-2.5 bg-white border-t border-[#F1F5F9] flex gap-2 overflow-x-auto flex-shrink-0">
              {quickReplies.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleQuickReply(chip)}
                  disabled={isTyping}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white text-[#374151] text-xs font-medium hover:border-[#6366F1] hover:text-[#6366F1] hover:bg-[#EEF2FF] transition-all disabled:opacity-40"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* AI Agent Hub (Permanent Action Buttons) */}
          {step === 'done' && !showGuestBlur && (
            <div className="px-4 py-3 bg-white border-t border-[#F1F5F9] flex gap-2 overflow-x-auto flex-shrink-0 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => askAgent("sip")} disabled={isTyping} className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#EEF2FF] text-[#4F46E5] text-sm font-semibold hover:bg-[#E0E7FF] transition-colors whitespace-nowrap disabled:opacity-50 border border-[#C7D2FE]">
                💰 Suggest SIPs
              </button>
              <button onClick={() => askAgent("insurance")} disabled={isTyping} className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#F0FDF4] text-[#16A34A] text-sm font-semibold hover:bg-[#DCFCE7] transition-colors whitespace-nowrap disabled:opacity-50 border border-[#BBF7D0]">
                🛡️ Do I need insurance?
              </button>
              <button onClick={() => askAgent("loan")} disabled={isTyping} className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#FFF7ED] text-[#EA580C] text-sm font-semibold hover:bg-[#FFEDD5] transition-colors whitespace-nowrap disabled:opacity-50 border border-[#FED7AA]">
                🏠 Optimize my EMIs
              </button>
              <button onClick={() => askAgent("expenses")} disabled={isTyping} className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#FDF2F8] text-[#DB2777] text-sm font-semibold hover:bg-[#FCE7F3] transition-colors whitespace-nowrap disabled:opacity-50 border border-[#FBCFE8]">
                📊 Track expenses
              </button>
            </div>
          )}

          <div className="flex items-center gap-2.5 px-4 py-3 bg-white border-t border-[#E2E8F0] flex-shrink-0">
            <button className="text-[#94A3B8] hover:text-[#6366F1] transition-colors flex-shrink-0">
              <Mic className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your answer..."
              disabled={isTyping || showWizard || !!showGuestBlur}
              className="flex-1 px-4 py-2.5 rounded-full bg-[#F1F5F9] text-[#0F172A] text-sm placeholder-[#94A3B8] outline-none focus:bg-white focus:ring-2 focus:ring-[#6366F1]/30 transition-all disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || showWizard || !!showGuestBlur}
              className="w-10 h-10 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] text-white flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Panel (desktop only) ────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
        <SummaryPanel
          collected={collected}
          taxResult={taxResult}
          fireResult={fireResult}
          progress={progress}
          onStartFire={() => {
            /* handled by chat flow */
          }}
        />
      </div>

      {/* ── Auth Modal ────────────────────────────────────── */}
      {authOpen && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setAuthOpen(false)}
          onEnterApp={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}