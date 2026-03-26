import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Compass, Calculator, Flame, Heart, BarChart3, ArrowRight, Shield, Zap, CheckCircle, Lock, Ban, Eye, Trash2 } from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

export function LandingPage() {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  const openLogin = () => { setAuthTab('login'); setAuthOpen(true); };
  const openRegister = () => { setAuthTab('register'); setAuthOpen(true); };

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Custom Scrollbar ── */}
      <style>{`
        :root { --arthmize-scroll: #6366F1; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #6366F1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #4F46E5; }
        * { scrollbar-width: thin; scrollbar-color: #6366F1 transparent; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16" style={{ background: '#0F172A' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Arthmize</span>
        </div>

        {/* Nav Links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it works', 'About'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-[#94A3B8] text-sm hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={openLogin}
            className="px-4 py-2 rounded-lg border border-white text-white text-sm hover:bg-white/10 transition-colors"
          >
            Login
          </button>
          <button
            onClick={openRegister}
            className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-sm hover:bg-[#4F46E5] transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section
        id="hero"
        className="flex flex-col items-center justify-center min-h-screen px-6 text-center pt-16"
        style={{ background: '#0F172A' }}
      >
        {/* Pill Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm mb-8"
          style={{ background: '#1E293B', borderColor: '#6366F1', color: '#6366F1' }}
        >
          <span className="text-base">✦</span>
          AI-Powered Financial Planning
        </div>

        {/* Headline */}
        <h1
          className="text-white font-bold text-center leading-tight mb-5"
          style={{ fontSize: 'clamp(36px, 6vw, 56px)', maxWidth: 640 }}
        >
          Your Money, Understood.
          <br />
          Your Future, Planned.
        </h1>

        {/* Subheading */}
        <p
          className="text-center mb-10"
          style={{ color: '#94A3B8', fontSize: 18, maxWidth: 520, lineHeight: 1.7 }}
        >
          Tax optimization, retirement planning, and financial health scoring — all in a 2-minute AI conversation.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 text-white font-semibold transition-colors px-6"
            style={{ background: '#6366F1', borderRadius: 10, height: 48, fontSize: 15 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4F46E5')}
            onMouseLeave={e => (e.currentTarget.style.background = '#6366F1')}
          >
            Start for Free <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#how-it-works"
            className="flex items-center gap-2 text-white font-semibold border border-white hover:bg-white/10 transition-colors px-6"
            style={{ borderRadius: 10, height: 48, fontSize: 15 }}
          >
            See how it works
          </a>
        </div>

        {/* Trust Strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {[
            { icon: <Shield className="w-4 h-4" />, text: 'Bank-grade security' },
            { icon: <Zap className="w-4 h-4" />, text: '2-min setup' },
            { icon: <CheckCircle className="w-4 h-4" />, text: 'SEBI compliant' },
          ].map((item, i) => (
            <span key={i} className="flex items-center gap-2 text-sm" style={{ color: '#64748B' }}>
              {item.icon}
              {item.text}
              {i < 2 && <span className="hidden md:inline mx-2 text-[#334155]">|</span>}
            </span>
          ))}
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="py-24 px-6" style={{ background: '#F8FAFC' }}>
        <div className="max-w-5xl mx-auto">
          {/* Label */}
          <p className="text-center text-sm font-semibold tracking-widest mb-4" style={{ color: '#6366F1' }}>
            WHAT WE DO
          </p>
          <h2
            className="text-center font-bold text-[#0F172A] mb-12"
            style={{ fontSize: 'clamp(26px, 4vw, 36px)', lineHeight: 1.3 }}
          >
            Everything you need to take<br className="hidden md:block" /> control of your finances
          </h2>

          {/* 2×2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Calculator className="w-5 h-5 text-white" />,
                iconBg: '#6366F1',
                title: 'Tax Regime Optimizer',
                body: 'Find out if old or new tax regime saves you more — with exact ₹ numbers and step-by-step reasoning.',
                link: '/tax',
              },
              {
                icon: <Flame className="w-5 h-5 text-white" />,
                iconBg: '#6366F1',
                title: 'FIRE Planner',
                body: 'Set your retirement age. Get exact SIP amounts, corpus targets, and a month-by-month roadmap.',
                link: '/fire',
              },
              {
                icon: <Heart className="w-5 h-5 text-white" />,
                iconBg: '#10B981',
                title: 'Money Health Score',
                body: 'A 5-minute check across 6 dimensions — emergency fund, insurance, investments, debt, tax, retirement.',
                link: '/health',
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-white" />,
                iconBg: '#6366F1',
                title: 'MF Portfolio X-Ray',
                body: 'Uncover fund overlap, expense drag, and get an AI rebalancing plan in seconds.',
                link: '/portfolio',
              },
            ].map((card) => (
              <div
                key={card.title}
                onClick={() => navigate(card.link)}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-7 cursor-pointer group hover:border-[#6366F1] hover:shadow-md transition-all"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: card.iconBg }}
                >
                  {card.icon}
                </div>
                <h3 className="text-[#0F172A] font-bold mb-2" style={{ fontSize: 18 }}>{card.title}</h3>
                <p className="text-[#64748B] leading-relaxed" style={{ fontSize: 14 }}>{card.body}</p>
                <span className="inline-flex items-center gap-1 mt-4 text-[#6366F1] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center font-bold text-[#0F172A] mb-16"
            style={{ fontSize: 'clamp(24px, 4vw, 32px)' }}
          >
            As simple as texting a friend
          </h2>

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-10 md:gap-0">
            {/* Connecting dashed line — desktop only */}
            <div
              className="hidden md:block absolute top-6 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px border-t-2 border-dashed border-[#C7D2FE]"
              aria-hidden="true"
            />

            {[
              {
                num: '1',
                color: '#6366F1',
                title: 'Tell us about yourself',
                body: 'Just chat naturally — salary, rent, age, goals',
              },
              {
                num: '2',
                color: '#6366F1',
                title: 'AI crunches the numbers',
                body: 'Deterministic calculations + Claude reasoning',
              },
              {
                num: '3',
                color: '#10B981',
                title: 'Get your plan',
                body: 'Specific numbers, not vague advice',
              },
            ].map((step) => (
              <div key={step.num} className="flex-1 flex flex-col items-center text-center px-4 relative z-10">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4 shadow-sm"
                  style={{ background: step.color }}
                >
                  {step.num}
                </div>
                <h3 className="text-[#0F172A] font-bold mb-2" style={{ fontSize: 16 }}>{step.title}</h3>
                <p className="text-[#64748B]" style={{ fontSize: 14 }}>{step.body}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-14">
            <button
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-2 text-white font-semibold px-8 transition-colors"
              style={{ background: '#6366F1', borderRadius: 10, height: 48, fontSize: 15 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4F46E5')}
              onMouseLeave={e => (e.currentTarget.style.background = '#6366F1')}
            >
              Try it now — it's free <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── DATA PROTECTION ── */}
      <section id="data-protection" className="py-20 px-6" style={{ background: '#0F172A' }}>
        <div className="max-w-5xl mx-auto">
          {/* Label */}
          <p className="text-center text-sm font-semibold tracking-widest mb-4" style={{ color: '#6366F1' }}>
            DATA PROTECTION
          </p>

          {/* Headline */}
          <h2
            className="text-center text-white font-bold mb-4"
            style={{ fontSize: 'clamp(24px, 4vw, 34px)', lineHeight: 1.3 }}
          >
            Your data. Protected. Period.
          </h2>
          <p className="text-center mb-14 mx-auto" style={{ color: '#94A3B8', fontSize: 15, maxWidth: 520, lineHeight: 1.7 }}>
            We store and process your financial details to give you accurate, personalised results —
            and we take that responsibility seriously.
          </p>

          {/* Highlight banner — NOT used for training */}
          <div
            className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl px-8 py-5 mb-10 mx-auto"
            style={{ background: '#1E293B', border: '1.5px solid #6366F1', maxWidth: 700 }}
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-[#6366F1]/20 flex items-center justify-center">
              <Ban className="w-5 h-5" style={{ color: '#6366F1' }} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-white font-bold" style={{ fontSize: 16 }}>
                Your data is <span style={{ color: '#6366F1' }}>never</span> used to train AI models
              </p>
              <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 3 }}>
                Your salary, savings, tax inputs and financial goals are used <strong style={{ color: '#CBD5E1' }}>only</strong> to
                calculate results for you — they are never fed into model training pipelines, shared with AI labs,
                or used to improve any third-party system.
              </p>
            </div>
          </div>

          {/* Protection points — 2 col grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: <Lock className="w-5 h-5" style={{ color: '#6366F1' }} />,
                title: 'End-to-end encrypted',
                body: 'All financial data is encrypted in transit (TLS 1.3) and at rest (AES-256) — the same standard used by banks.',
              },
              {
                icon: <Shield className="w-5 h-5" style={{ color: '#6366F1' }} />,
                title: 'Bank-grade infrastructure',
                body: 'Hosted on SOC 2-certified servers. Your data never touches unsecured environments.',
              },
              {
                icon: <Eye className="w-5 h-5" style={{ color: '#6366F1' }} />,
                title: 'Zero third-party sharing',
                body: 'We do not sell, rent, or share your personal or financial data with advertisers, data brokers, or partners.',
              },
              {
                icon: <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />,
                title: 'Stored in India',
                body: 'Your data resides on Indian servers, compliant with the Digital Personal Data Protection Act, 2023.',
              },
              {
                icon: <Trash2 className="w-5 h-5" style={{ color: '#6366F1' }} />,
                title: 'Delete anytime, no questions',
                body: 'Request full deletion of your account and all associated data with one click. Processed within 24 hours.',
              },
              {
                icon: <Ban className="w-5 h-5" style={{ color: '#F59E0B' }} />,
                title: 'Not for model training — ever',
                body: 'Your inputs power your results only. No financial data is ever used to fine-tune, train, or benchmark any AI model.',
                highlight: true,
              },
            ].map((pt) => (
              <div
                key={pt.title}
                className="flex items-start gap-4 rounded-xl px-5 py-5 transition-all"
                style={{
                  background: pt.highlight ? '#1E293B' : 'rgba(255,255,255,0.04)',
                  border: pt.highlight ? '1px solid #F59E0B44' : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  {pt.icon}
                </div>
                <div>
                  <p className="text-white font-bold mb-1" style={{ fontSize: 14 }}>{pt.title}</p>
                  <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6 }}>{pt.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12 py-12 flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: '#0F172A' }}>
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1] flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold">Arthmize</span>
          </div>
          <p className="text-[#475569] text-xs text-center md:text-left">
            Not a SEBI-registered advisor. For informational use only.
          </p>
        </div>
        <div className="flex items-center gap-6">
          {['Privacy', 'Terms', 'Contact'].map((link) => (
            <a key={link} href="#" className="text-[#64748B] text-sm hover:text-[#94A3B8] transition-colors">
              {link}
            </a>
          ))}
        </div>
      </footer>

      {/* ── AUTH MODAL ── */}
      {authOpen && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setAuthOpen(false)}
          onEnterApp={() => { setAuthOpen(false); navigate('/chat'); }}
        />
      )}
    </div>
  );
}