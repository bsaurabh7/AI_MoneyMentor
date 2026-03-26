/**
 * Arthmize — Auth Context
 * ─────────────────────────────────────────────────────────────
 * Wraps the app with Supabase auth state. Provides:
 *   • user            — current Supabase user (null if logged out)
 *   • profile         — user_profiles row (null until loaded)
 *   • loading         — true while session is being resolved
 *   • signUp()        — register with email + password + metadata
 *   • signIn()        — login with email + password
 *   • signInWithOtp() — send OTP to email (for verification)
 *   • verifyOtp()     — verify the OTP token
 *   • signInGoogle()  — OAuth with Google
 *   • signOut()       — logout
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase, type UserProfile } from '../../lib/supabase';

/* ── Types ── */
interface SignUpOptions {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;   // ISO: "YYYY-MM-DD"
}

interface AuthResult {
  error: AuthError | Error | null;
  success: boolean;
  message?: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (opts: SignUpOptions) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  sendOtp: (email: string) => Promise<AuthResult>;
  verifyOtp: (email: string, token: string) => Promise<AuthResult>;
  signInGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/* ── Context ── */
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Load profile from user_profiles table ── */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (!error && data) setProfile(data as UserProfile);
    } catch {
      // profile may not exist yet for new users
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  /* ── Subscribe to Supabase auth state changes ── */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadProfile(u.id);
      setLoading(false);
    });

    // Listen for future changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) await loadProfile(u.id);
        else setProfile(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  /* ── Sign Up ── */
  const signUp = useCallback(async ({
    email, password, fullName, phone, dateOfBirth,
  }: SignUpOptions): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name:     fullName,
            phone:         phone ?? '',
            date_of_birth: dateOfBirth ?? '',
          },
          // emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/callback`,
        },
      });

      if (error) return { error, success: false, message: error.message };

      // If email confirmation is disabled in Supabase, user is signed in immediately
      if (data.user && !data.session) {
        return {
          error: null,
          success: true,
          message: 'Check your email to confirm your account.',
        };
      }

      return { error: null, success: true };
    } catch (err) {
      return { error: err as Error, success: false, message: 'An unexpected error occurred.' };
    }
  }, []);

  /* ── Sign In ── */
  const signIn = useCallback(async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error, success: false, message: error.message };
      return { error: null, success: true };
    } catch (err) {
      return { error: err as Error, success: false, message: 'An unexpected error occurred.' };
    }
  }, []);

  /* ── Send OTP ── */
  const sendOtp = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) return { error, success: false, message: error.message };
      return { error: null, success: true, message: 'OTP sent to your email.' };
    } catch (err) {
      return { error: err as Error, success: false, message: 'Failed to send OTP.' };
    }
  }, []);

  /* ── Verify OTP ── */
  const verifyOtp = useCallback(async (
    email: string,
    token: string,
  ): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) return { error, success: false, message: error.message };
      return { error: null, success: true };
    } catch (err) {
      return { error: err as Error, success: false, message: 'Invalid OTP.' };
    }
  }, []);

  /* ── Google OAuth ── */
  const signInGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/chat`,
        },
      });
      if (error) return { error, success: false, message: error.message };
      return { error: null, success: true };
    } catch (err) {
      return { error: err as Error, success: false, message: 'Google sign-in failed.' };
    }
  }, []);

  /* ── Sign Out ── */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      sendOtp,
      verifyOtp,
      signInGoogle,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
