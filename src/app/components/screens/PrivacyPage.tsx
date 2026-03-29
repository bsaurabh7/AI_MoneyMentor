import { useNavigate } from 'react-router';
import { ArrowLeft, Compass, Shield, Lock, Eye, Trash2 } from 'lucide-react';

export function PrivacyPage() {
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

      <main className="max-w-4xl mx-auto px-6 md:px-8 py-14">
        <p className="text-sm font-semibold tracking-widest text-[#6366F1] mb-3">PRIVACY POLICY</p>
        <h1 className="text-white font-bold mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Your privacy comes first
        </h1>
        <p className="text-[#94A3B8] leading-relaxed mb-10">
          Arthmize uses your financial details only to generate your analysis and recommendations.
          We do not sell your data, and we do not use personal financial inputs to train AI models.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {[
            {
              icon: <Lock className="w-5 h-5 text-[#6366F1]" />,
              title: 'Secure by default',
              body: 'All data is encrypted in transit and at rest using modern security standards.',
            },
            {
              icon: <Shield className="w-5 h-5 text-[#6366F1]" />,
              title: 'Limited access',
              body: 'Access to systems is restricted and monitored to protect your information.',
            },
            {
              icon: <Eye className="w-5 h-5 text-[#6366F1]" />,
              title: 'No data selling',
              body: 'We never sell or rent your personal or financial data to third parties.',
            },
            {
              icon: <Trash2 className="w-5 h-5 text-[#6366F1]" />,
              title: 'Deletion support',
              body: 'You can request account and data deletion, subject to legal retention needs.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-white/10 bg-[#1E293B] p-5">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">{item.icon}</div>
              <h2 className="text-white font-semibold mb-2">{item.title}</h2>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <h2 className="text-white font-semibold mb-3">Data Use Summary</h2>
          <ul className="space-y-2 text-sm text-[#94A3B8]">
            <li>1. We collect only information needed to provide product features and support.</li>
            <li>2. We process data to calculate outputs and personalize your app experience.</li>
            <li>3. We retain data only as long as needed for service delivery and compliance.</li>
            <li>4. We may update this policy as features and regulations evolve.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
