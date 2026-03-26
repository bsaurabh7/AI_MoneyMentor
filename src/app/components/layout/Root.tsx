import { NavLink, Outlet, useLocation } from 'react-router';
import {
  Calculator,
  Flame,
  Heart,
  BarChart3,
  Compass,
  Settings,
  AlertTriangle,
  Menu,
  X,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { DisclaimerBanner } from '../shared/DisclaimerBanner';

const navItems = [
  { path: '/chat', label: 'AI Chat', icon: MessageCircle },
  { path: '/tax', label: 'Tax Optimizer', icon: Calculator },
  { path: '/fire', label: 'FIRE Planner', icon: Flame },
  { path: '/health', label: 'Money Health', icon: Heart },
  { path: '/portfolio', label: 'Portfolio X-Ray', icon: BarChart3 },
];

const pageTitles: Record<string, string> = {
  '/chat': 'AI Money Mentor',
  '/tax': 'Tax Regime Optimizer',
  '/fire': 'FIRE Planner',
  '/health': 'Money Health Score',
  '/portfolio': 'MF Portfolio X-Ray',
};

export function Root() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isChat = location.pathname === '/chat';
  const pageTitle = pageTitles[location.pathname] ?? 'FinPilot AI';

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[260px] flex-shrink-0 h-full" style={{ background: '#0F172A' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#6366F1]">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">FinPilot AI</span>
        </div>

        {/* User Greeting */}
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
            S
          </div>
          <span className="text-[#94A3B8] text-sm">Hello, Saurabh</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 mt-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-[#0F172A]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {path === '/chat' && (
                <span className="ml-auto bg-[#6366F1] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  NEW
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-5 border-t border-white/10">
          <button className="flex items-center gap-2 text-[#64748B] hover:text-[#94A3B8] text-sm transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <p className="text-[#475569] text-xs mt-3 leading-relaxed">
            Not a licensed financial advisor. AI-generated analysis for educational purposes only.
          </p>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col" style={{ background: '#0F172A' }}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#6366F1]">
                  <Compass className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg">FinPilot AI</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-[#94A3B8]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
                S
              </div>
              <span className="text-[#94A3B8] text-sm">Hello, Saurabh</span>
            </div>
            <nav className="flex-1 px-3 space-y-1 mt-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-white text-[#0F172A]' : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar — hidden on chat (has its own header) */}
        {!isChat && (
          <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0] flex-shrink-0">
            <div className="flex items-center gap-3">
              <button className="md:hidden text-[#64748B] hover:text-[#0F172A]" onClick={() => setMobileOpen(true)}>
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-[#0F172A] font-semibold text-lg">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFBEB] border border-[#FCD34D]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#92400E]" />
              <span className="text-[#92400E] text-xs font-medium">Not financial advice</span>
            </div>
          </header>
        )}

        {/* Mobile menu trigger row on chat */}
        {isChat && (
          <div className="md:hidden flex items-center px-4 py-2 bg-white border-b border-[#F1F5F9]">
            <button className="text-[#64748B]" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <main className={`flex-1 min-h-0 ${isChat ? 'overflow-hidden' : 'overflow-y-auto pb-20 md:pb-6'}`}>
          <Outlet />
        </main>

        {/* Disclaimer Banner — hidden on chat (shown inline in summary) */}
        {!isChat && (
          <div className="hidden md:block px-6 py-2 bg-white border-t border-[#E2E8F0]">
            <DisclaimerBanner />
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-[#E2E8F0]">
        <div className="flex">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive ? 'text-[#6366F1]' : 'text-[#94A3B8]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] leading-none font-medium">{label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
