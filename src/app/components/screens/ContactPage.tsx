import { useNavigate } from 'react-router';
import { ArrowLeft, Compass, Mail, MessageSquare, Clock3, ArrowUpRight } from 'lucide-react';

export function ContactPage() {
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
        <p className="text-sm font-semibold tracking-widest text-[#6366F1] mb-3">CONTACT</p>
        <h1 className="text-white font-bold mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
          We are here to help
        </h1>
        <p className="text-[#94A3B8] leading-relaxed mb-10">
          Need support, found an issue, or want to request a feature? Reach out and we will get back as soon as possible.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 items-stretch">
          <section className="rounded-xl border border-white/10 bg-[#1E293B] p-5 flex flex-col h-full">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h2 className="text-white font-semibold mb-1">Email</h2>
            <p className="text-[#94A3B8] text-sm mb-4">support@arthmize.ai</p>
            <a
              href="mailto:support@arthmize.ai?subject=Arthmize%20Support%20Request"
              aria-label="Email Support"
              title="Email Support"
              className="mt-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#1E293B] p-5 flex flex-col h-full">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h2 className="text-white font-semibold mb-1">Product Feedback</h2>
            <p className="text-[#94A3B8] text-sm mb-4">Share ideas and improvements.</p>
            <a
              href="mailto:support@arthmize.ai?subject=Arthmize%20Product%20Feedback"
              aria-label="Send Feedback"
              title="Send Feedback"
              className="mt-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#1E293B] p-5 flex flex-col h-full">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3">
              <Clock3 className="w-5 h-5 text-[#6366F1]" />
            </div>
            <h2 className="text-white font-semibold mb-1">Response Time</h2>
            <p className="text-[#94A3B8] text-sm mb-4">Response within 24-48 hours.</p>
            <a
              href="mailto:support@arthmize.ai?subject=Arthmize%20Follow-up%20on%20Support%20Request"
              aria-label="Draft Follow-up"
              title="Draft Follow-up"
              className="mt-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </section>
        </div>

        <section className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <h2 className="text-white font-semibold mb-3">Before You Contact</h2>
          <ul className="space-y-2 text-sm text-[#94A3B8]">
            <li>1. Include screenshots for UI issues.</li>
            <li>2. Mention browser and device details for bug reports.</li>
            <li>3. Share expected vs actual behavior for faster resolution.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
