import { useNavigate } from 'react-router';
import { ArrowLeft, Compass, Building2, Target, Users, CheckCircle2 } from 'lucide-react';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, sans-serif', background: '#0F172A' }}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0F172A]/95 backdrop-blur px-6 md:px-12 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Arthmize</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-8 py-14">
        <p className="text-sm font-semibold tracking-widest text-[#6366F1] mb-3">ABOUT US</p>
        <h1 className="text-white font-bold mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Building confident money decisions for everyone
        </h1>
        <p className="text-[#94A3B8] leading-relaxed mb-10 max-w-3xl">
          Arthmize is an AI-first personal finance platform that helps users understand tax choices,
          retirement readiness, money health, and portfolio quality with clear, explainable insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <section className="rounded-xl border border-white/10 bg-[#1E293B] p-6">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h2 className="text-white font-semibold mb-3">Company Details</h2>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li>1. Company: Arthmize (AI Money Mentor)</li>
              <li>2. Category: Personal Finance and Financial Wellness</li>
              <li>3. Core Product: AI-guided tax, FIRE, health score, and portfolio analysis</li>
              <li>4. Region Focus: India</li>
              <li>5. Compliance Position: Informational insights, not licensed financial advice</li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#1E293B] p-6">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h2 className="text-white font-semibold mb-3">Mission</h2>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
              Make high-quality financial guidance accessible, practical, and transparent for every user,
              so better financial decisions feel simple and actionable.
            </p>
            <div className="rounded-lg border border-[#6366F133] bg-[#6366F11A] p-3">
              <p className="text-xs text-[#C7D2FE]">
                Focus areas: tax optimization, retirement planning, debt awareness, and portfolio hygiene.
              </p>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-white/10 bg-[#111827] p-6 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-white font-semibold">Our Team</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Pankaj Mehta', role: 'Full-Stack and Backend' },
              { name: 'Atharva Varhadi', role: 'Integration and DevOps' },
              { name: 'Saurabh Babalsure', role: 'AI Agents and Models' },
            ].map((member) => (
              <div key={member.name} className="rounded-lg border border-white/10 bg-[#1E293B] px-4 py-4">
                <p className="text-white font-semibold text-sm">{member.name}</p>
                <p className="text-[#94A3B8] text-xs mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#10B98144] bg-[#10B98112] p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#34D399] mt-0.5" />
            <p className="text-sm text-[#A7F3D0] leading-relaxed">
              Arthmize provides educational analysis and planning support. Users should validate recommendations
              before taking financial decisions and consult qualified professionals where required.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
