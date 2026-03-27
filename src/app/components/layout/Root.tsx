import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
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
  LogOut,
  Lock,
  User,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { DisclaimerBanner } from '../shared/DisclaimerBanner';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';

const navItems = [
  { path: '/chat', label: 'AI Chat', icon: MessageCircle },
  { path: '/tax', label: 'Tax Optimizer', icon: Calculator },
  { path: '/fire', label: 'FIRE Planner', icon: Flame },
  { path: '/health', label: 'Money Health', icon: Heart },
  { path: '/portfolio', label: 'Portfolio X-Ray', icon: BarChart3 },
  { path: '/profile', label: 'My Profile', icon: User },
];

const pageTitles: Record<string, string> = {
  '/chat': 'AI Money Mentor',
  '/tax': 'Tax Regime Optimizer',
  '/fire': 'FIRE Planner',
  '/health': 'Money Health Score',
  '/portfolio': 'MF Portfolio X-Ray',
};

// Mobile bottom nav height in px (used to offset chat input)
const MOBILE_NAV_H = 56;

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const isChat = location.pathname === '/chat';
  const pageTitle = pageTitles[location.pathname] ?? 'Arthmize';

  // Listen for context-menu auth triggers
  useEffect(() => {
    const handleOpenAuth = () => setAuthOpen(true);
    document.addEventListener('az:open-auth-modal', handleOpenAuth);
    return () => document.removeEventListener('az:open-auth-modal', handleOpenAuth);
  }, []);

  /* Derive display name: profile > user metadata > email prefix */
  const displayName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'User';

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Custom narrow scrollbar */}
      <style>{`
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #6366F1; border-radius: 9999px; }
        ::-webkit-scrollbar-thumb:hover { background: #4F46E5; }
        * { scrollbar-width: thin; scrollbar-color: #6366F1 transparent; }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[260px] flex-shrink-0 h-full" style={{ background: '#0F172A' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#6366F1]">
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Arthmize</span>
        </div>

        {/* User Greeting */}
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
          <span className="text-[#94A3B8] text-sm truncate">Hello, {displayName.split(' ')[0]}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1 mt-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isLocked = !user && path !== '/chat';
            if (isLocked) {
              return (
                <button
                  key={path}
                  onClick={() => setAuthOpen(true)}
                  className="w-full flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-medium transition-all text-[#64748B] hover:text-[#94A3B8] hover:bg-white/5 cursor-not-allowed justify-between"
                  title="Login to access"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0 opacity-50" />
                    <span className="opacity-70">{label}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                </button>
              );
            }
            return (
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
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-6 py-5 border-t border-white/10">
          <button className="flex items-center gap-2 text-[#64748B] hover:text-[#94A3B8] text-sm transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-[#64748B] hover:text-red-400 text-sm transition-colors mt-2">
            <LogOut className="w-4 h-4" />
            Sign out
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
                <span className="text-white font-bold text-lg">Arthmize</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-[#94A3B8]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <span className="text-[#94A3B8] text-sm">Hello, {displayName.split(' ')[0]}</span>
            </div>
            <nav className="flex-1 px-3 space-y-1 mt-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isLocked = !user && path !== '/chat';
                if (isLocked) {
                  return (
                    <button
                      key={path}
                      onClick={() => { setMobileOpen(false); setAuthOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-medium transition-all text-[#64748B] justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 flex-shrink-0 opacity-50" />
                        <span className="opacity-70">{label}</span>
                      </div>
                      <Lock className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                    </button>
                  );
                }
                return (
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
                );
              })}
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

        {/* Mobile menu trigger on chat */}
        {isChat && (
          <div className="md:hidden flex items-center px-4 py-2 bg-white border-b border-[#F1F5F9] flex-shrink-0">
            <button className="text-[#64748B]" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Content
            On mobile: leave room at the bottom for the fixed nav bar
            On chat: overflow-hidden so the chat manages its own scroll */}
        <main
          className={`flex-1 min-h-0 ${isChat ? 'overflow-hidden' : 'overflow-y-auto pb-20 md:pb-6'}`}
          style={isChat ? { paddingBottom: `${MOBILE_NAV_H}px` } : undefined}
        >
          <Outlet />
        </main>

        {/* Disclaimer Banner — hidden on chat */}
        {!isChat && (
          <div className="hidden md:block px-6 py-2 bg-white border-t border-[#E2E8F0]">
            <DisclaimerBanner />
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-[#E2E8F0]"
        style={{ height: MOBILE_NAV_H }}
      >
        <div className="flex h-full">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isLocked = !user && path !== '/chat';
            if (isLocked) {
              return (
                <button
                  key={path}
                  onClick={() => setAuthOpen(true)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors text-[#94A3B8]/50"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-[9px] leading-none font-medium text-opacity-70">{label.split(' ')[0]}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isActive ? 'text-[#6366F1]' : 'text-[#94A3B8]'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] leading-none font-medium">{label.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* ── AUTH MODAL ── */}
      {authOpen && (
        <AuthModal initialTab="login" onClose={() => setAuthOpen(false)} onEnterApp={() => setAuthOpen(false)} />
      )}
    </div>
  );
}