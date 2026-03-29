import { useEffect, useMemo, useState } from 'react';
import { Bell, Palette, ShieldAlert, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type ThemeMode = 'system' | 'light' | 'dark';

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = mode === 'dark' || (mode === 'system' && prefersDark);
  root.classList.toggle('dark', shouldUseDark);
}

export function SettingsPage() {
  const { user, profile } = useAuth();

  const [theme, setTheme] = useState<ThemeMode>('system');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState(true);
  const [smartReminders, setSmartReminders] = useState(false);

  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestReason, setRequestReason] = useState('Data privacy preference');
  const [requestMessage, setRequestMessage] = useState('Please delete my account and all associated data.');

  useEffect(() => {
    const storedTheme = (localStorage.getItem('arthmize_theme') as ThemeMode | null) ?? 'system';
    const storedEmailAlerts = localStorage.getItem('arthmize_email_alerts');
    const storedMonthlySummary = localStorage.getItem('arthmize_monthly_summary');
    const storedSmartReminders = localStorage.getItem('arthmize_smart_reminders');

    setTheme(storedTheme);
    if (storedEmailAlerts !== null) setEmailAlerts(storedEmailAlerts === 'true');
    if (storedMonthlySummary !== null) setMonthlySummary(storedMonthlySummary === 'true');
    if (storedSmartReminders !== null) setSmartReminders(storedSmartReminders === 'true');

    applyTheme(storedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('arthmize_theme', theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('arthmize_email_alerts', String(emailAlerts));
  }, [emailAlerts]);

  useEffect(() => {
    localStorage.setItem('arthmize_monthly_summary', String(monthlySummary));
  }, [monthlySummary]);

  useEffect(() => {
    localStorage.setItem('arthmize_smart_reminders', String(smartReminders));
  }, [smartReminders]);

  useEffect(() => {
    if (!user) return;

    const profileName = profile?.full_name;
    const metadataName = user.user_metadata?.full_name as string | undefined;
    const emailPrefix = user.email?.split('@')[0];

    setRequestName(profileName || metadataName || emailPrefix || '');
    setRequestEmail(user.email ?? '');
  }, [profile, user]);

  const deleteRequestMailTo = useMemo(() => {
    const subject = encodeURIComponent(`Account Deletion Request - ${requestEmail || 'Arthmize User'}`);
    const body = encodeURIComponent(
      [
        'Hello Arthmize Team,',
        '',
        'I would like to request account deletion.',
        '',
        `Name: ${requestName || 'Not provided'}`,
        `Email: ${requestEmail || 'Not provided'}`,
        `Reason: ${requestReason || 'Not provided'}`,
        '',
        'Additional Message:',
        requestMessage || 'No additional message provided.',
        '',
        'Please confirm once my account deletion request is processed.',
      ].join('\n')
    );

    return `mailto:support@arthmize.ai?subject=${subject}&body=${body}`;
  }, [requestEmail, requestMessage, requestName, requestReason]);

  return (
    <div className="px-6 py-6 md:px-8 max-w-5xl mx-auto">
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 md:p-7 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-[#6366F1]" />
          <h2 className="text-[#0F172A] font-semibold text-lg">Theme</h2>
        </div>

        <label htmlFor="themeSelect" className="text-sm text-[#475569] block mb-2">Select your appearance</label>
        <select
          id="themeSelect"
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeMode)}
          className="w-full md:w-[280px] rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] bg-white"
        >
          <option value="system">System Default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 md:p-7 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-[#6366F1]" />
          <h2 className="text-[#0F172A] font-semibold text-lg">Regular Settings</h2>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[#0F172A]">Email alerts for important updates</span>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 accent-[#6366F1]"
            />
          </label>

          <label className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[#0F172A]">Monthly finance summary reminders</span>
            <input
              type="checkbox"
              checked={monthlySummary}
              onChange={(e) => setMonthlySummary(e.target.checked)}
              className="h-4 w-4 accent-[#6366F1]"
            />
          </label>

          <label className="flex items-center justify-between gap-4 text-sm">
            <span className="text-[#0F172A]">Smart nudges for tax and investment actions</span>
            <input
              type="checkbox"
              checked={smartReminders}
              onChange={(e) => setSmartReminders(e.target.checked)}
              className="h-4 w-4 accent-[#6366F1]"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-6 md:p-7">
        <div className="flex items-center gap-2 mb-5">
          <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
          <h2 className="text-[#7F1D1D] font-semibold text-lg">Delete Account Request</h2>
        </div>

        <p className="text-sm text-[#7F1D1D] mb-5">
          Fill this form and submit. It opens your email client with all details addressed to our support team.
        </p>
        <p className="text-xs text-[#991B1B] mb-5">
          Name and email are auto-fetched from your profile and cannot be edited here.
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = deleteRequestMailTo;
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="delName" className="block text-sm text-[#7F1D1D] mb-1">Full Name</label>
              <input
                id="delName"
                type="text"
                value={requestName}
                readOnly
                className="w-full rounded-lg border border-[#FCA5A5] bg-[#FFF7F7] px-3 py-2 text-sm text-[#0F172A] cursor-not-allowed"
                required
              />
            </div>
            <div>
              <label htmlFor="delEmail" className="block text-sm text-[#7F1D1D] mb-1">Email</label>
              <input
                id="delEmail"
                type="email"
                value={requestEmail}
                readOnly
                className="w-full rounded-lg border border-[#FCA5A5] bg-[#FFF7F7] px-3 py-2 text-sm text-[#0F172A] cursor-not-allowed"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="delReason" className="block text-sm text-[#7F1D1D] mb-1">Reason</label>
            <select
              id="delReason"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="w-full rounded-lg border border-[#FCA5A5] bg-white px-3 py-2 text-sm text-[#0F172A]"
              required
            >
              <option value="Data privacy preference">Data privacy preference</option>
              <option value="No longer using the platform">No longer using the platform</option>
              <option value="Created duplicate account">Created duplicate account</option>
              <option value="Not satisfied with features">Not satisfied with features</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="delMessage" className="block text-sm text-[#7F1D1D] mb-1">Additional Message</label>
            <textarea
              id="delMessage"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full rounded-lg border border-[#FCA5A5] bg-white px-3 py-2 text-sm text-[#0F172A] min-h-28"
              required
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors"
          >
            <Send className="w-4 h-4" />
            Send Deletion Request
          </button>
        </form>
      </div>
    </div>
  );
}
