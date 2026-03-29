import { useNavigate } from 'react-router';
import { ArrowLeft, Compass, AlertTriangle, FileText, Scale } from 'lucide-react';

export function TermsPage() {
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
        <p className="text-sm font-semibold tracking-widest text-[#6366F1] mb-3">TERMS OF USE</p>
        <h1 className="text-white font-bold mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          Terms and conditions
        </h1>
        <p className="text-[#94A3B8] leading-relaxed mb-10">
          By using Arthmize, you agree to these terms. The platform provides educational financial insights,
          and does not provide licensed investment, legal, or tax advice.
        </p>

        <div className="space-y-4 mb-10">
          {[
            {
              icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
              title: 'No financial advisory relationship',
              body: 'Outputs are informational and should not be treated as personalized regulated advice.',
            },
            {
              icon: <FileText className="w-5 h-5 text-[#6366F1]" />,
              title: 'User responsibilities',
              body: 'You are responsible for verifying data inputs and consulting qualified professionals when needed.',
            },
            {
              icon: <Scale className="w-5 h-5 text-[#6366F1]" />,
              title: 'Service updates',
              body: 'We may modify features, terms, and policies as the product and legal requirements change.',
            },
          ].map((item) => (
            <section key={item.title} className="rounded-xl border border-white/10 bg-[#1E293B] p-6">
              <div className="flex items-center gap-3 mb-2">
                {item.icon}
                <h2 className="text-white font-semibold">{item.title}</h2>
              </div>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{item.body}</p>
            </section>
          ))}
        </div>

        <section className="rounded-xl border border-[#F59E0B55] bg-[#F59E0B10] p-6">
          <p className="text-[#FDE68A] text-sm leading-relaxed">
            Important: Always evaluate risk, review assumptions, and validate recommendations before taking any
            financial action.
          </p>
        </section>
      </main>
    </div>
  );
}
