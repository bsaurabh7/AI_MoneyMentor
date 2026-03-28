/**
 * useFireRecommendations.ts
 * ─────────────────────────────────────────────────────────
 * State machine: idle → loading → ready | error
 *
 * IMPORTANT — token-efficient design:
 *  - Only ONE backend call per user+riskProfile session (guarded by fetchedKeyRef)
 *  - Supabase 24h cache checked FIRST — if fresh, no backend call at all
 *  - Volatile params (sipAmount, age, etc.) passed via ref, never cause re-fetches
 *  - prefetchFireRecs uses a module-level Set to prevent duplicate concurrent calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiveSipFund {
  name: string;
  category: string;
  amc: string;
  returns_1y?: number | null;
  returns_3y?: number | null;
  returns_5y?: number | null;
  expense_ratio?: number | null;
  risk_level: string;
  allocation_pct: number;
  suggested_sip: number;
  why: string;
  ai_confidence: number;
  source: string;
}

export interface LiveInsuranceRec {
  type: string;
  plan_name: string;
  provider: string;
  cover_recommended: string;
  approx_premium: string;
  urgency: 'high' | 'medium';
  why: string;
  url?: string | null;
}

export interface FireRecsData {
  sip_funds: LiveSipFund[];
  insurance: LiveInsuranceRec[];
  ai_summary: string;
}

export type FireRecsStatus = 'idle' | 'loading' | 'ready' | 'error' | 'rate_limited';

export interface UseFireRecsResult {
  status: FireRecsStatus;
  data: FireRecsData | null;
  attemptsRemaining: number | null;
  trigger: () => void;
}

interface FireRecsParams {
  userId: string | null;
  riskProfile: 'aggressive' | 'moderate' | 'conservative';
  sipAmount: number;
  annualIncome: number;
  age: number;
  hasTermInsurance: boolean;
  hasHealthInsurance: boolean;
  enabled: boolean;
}

const BACKEND_URL = 'http://localhost:8000';
const CACHE_HOURS = 24;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFireRecommendations(params: FireRecsParams): UseFireRecsResult {
  const [status, setStatus] = useState<FireRecsStatus>('idle');
  const [data, setData] = useState<FireRecsData | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Key-based guard: only fetch once per userId+riskProfile per mount
  const fetchedKeyRef = useRef<string | null>(null);

  // Initial fetch of usage quota
  useEffect(() => {
    if (params.userId) {
      fetch(`${BACKEND_URL}/api/agents/fire-recs/usage?user_id=${params.userId}`)
        .then(r => r.json())
        .then(res => {
          if (res && typeof res.analysis_remaining === 'number') {
            setAttemptsRemaining(res.analysis_remaining);
          }
        })
        .catch(console.warn);
    }
  }, [params.userId]);

  // Keep volatile params in a ref so they don't cause useCallback/useEffect to re-run
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Initial fetch of usage quota

  const fetchRecs = useCallback(async () => {
    const { userId, riskProfile, sipAmount, annualIncome, age, hasTermInsurance, hasHealthInsurance, enabled } = paramsRef.current;

    if (!userId || !enabled) return;

    // Guard: already fetched for this exact user+risk combo this session
    const fetchKey = `${userId}_${riskProfile}`;
    if (fetchedKeyRef.current === fetchKey) return;
    fetchedKeyRef.current = fetchKey;

    setStatus('loading');

    try {
      // ── Step 1: Check Supabase cache ──────────────────────────────
      const { data: cached, error: cacheErr } = await supabase
        .from('fire_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('risk_profile', riskProfile)
        .maybeSingle();

      if (!cacheErr && cached?.status === 'ready' && cached.sip_funds) {
        const fresh = cached.expires_at && new Date(cached.expires_at) > new Date();
        if (fresh) {
          console.log('[FireRecs] Serving from Supabase cache — no HF token used ✅');
          setData({
            sip_funds: cached.sip_funds as LiveSipFund[],
            insurance: (cached.insurance ?? []) as LiveInsuranceRec[],
            ai_summary: cached.ai_summary ?? '',
          });
          setStatus('ready');
          return;
        }
      }

      // ── Step 2: Call Python backend (uses 2 HF API calls per run) ─
      console.log('[FireRecs] Cache miss → calling backend pipeline (uses HF tokens)');
      const response = await fetch(`${BACKEND_URL}/api/agents/fire-recs/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          risk_profile: riskProfile,
          sip_amount: Math.max(sipAmount, 1000),
          annual_income: Math.max(annualIncome, 0),
          age: Math.max(age, 18),
          has_term_insurance: hasTermInsurance,
          has_health_insurance: hasHealthInsurance,
          call_type: 'analysis',
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const errData = await response.json();
          console.warn(`[FireRecs] Rate limit reached: ${errData.detail?.message}`);
          if (errData.detail?.attempts_remaining !== undefined) {
            setAttemptsRemaining(errData.detail.attempts_remaining);
          }
          setStatus('rate_limited');
          throw new Error('daily_limit_reached');
        }
        throw new Error(`Backend ${response.status}`);
      }

      const json = await response.json();
      if (json.status !== 'ready' || !json.data) throw new Error('Non-ready status from pipeline');

      const recsData: FireRecsData = json.data;
      if (json.data.attempts_remaining !== undefined) {
         console.log(`[FireRecs] Attempts remaining today: ${json.data.attempts_remaining}`);
         setAttemptsRemaining(json.data.attempts_remaining);
      }

      // ── Step 3: Write to Supabase (24h cache) ─────────────────────
      const expiresAt = new Date(Date.now() + CACHE_HOURS * 60 * 60 * 1000).toISOString();
      await supabase.from('fire_recommendations').upsert({
        user_id: userId,
        risk_profile: riskProfile,
        status: 'ready',
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt,
        sip_funds: recsData.sip_funds,
        insurance: recsData.insurance,
        ai_summary: recsData.ai_summary,
      }, { onConflict: 'user_id,risk_profile' });

      setData(recsData);
      setStatus('ready');
    } catch (err) {
      console.warn('[FireRecs] Pipeline error → falling back to static:', err);
      // Reset so a manual trigger can retry
      fetchedKeyRef.current = null;
      setStatus('error');
    }
  // ⚠️ Only userId and riskProfile in deps — NOT sipAmount/age/etc.
  // Those are read from paramsRef.current inside the callback, preventing ghost re-fetches.
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { userId, enabled, riskProfile } = paramsRef.current;
    if (!enabled || !userId) return;

    const fetchKey = `${userId}_${riskProfile}`;
    // Skip if we already fetched this key
    if (fetchedKeyRef.current === fetchKey) return;

    fetchRecs();
  // Only re-run when enabled flips true, userId changes, or riskProfile changes
  }, [params.enabled, params.userId, params.riskProfile, fetchRecs]);

  return { status, data, attemptsRemaining, trigger: fetchRecs };
}

// ── Background prefetch — module-level Set prevents duplicate concurrent calls ──

const _prefetchInProgress = new Set<string>();

export async function prefetchFireRecs(
  userId: string,
  riskProfile: 'aggressive' | 'moderate' | 'conservative',
  annualIncome: number,
  age: number,
  hasTermInsurance: boolean,
  hasHealthInsurance: boolean,
): Promise<void> {
  const key = `${userId}_${riskProfile}`;

  // Hard guard: if already running or recently done this session, skip
  if (_prefetchInProgress.has(key)) {
    console.log('[FireRecs Prefetch] Already in progress, skipping duplicate call');
    return;
  }

  try {
    // Check Supabase first — if fresh, don't call backend at all
    const { data: cached } = await supabase
      .from('fire_recommendations')
      .select('expires_at, status')
      .eq('user_id', userId)
      .eq('risk_profile', riskProfile)
      .maybeSingle();

    if (cached?.status === 'ready' && cached.expires_at) {
      const fresh = new Date(cached.expires_at) > new Date();
      if (fresh) {
        console.log('[FireRecs Prefetch] Fresh cache found — skipping backend call ✅');
        return;
      }
    }

    // Mark as in-progress
    _prefetchInProgress.add(key);

    fetch(`${BACKEND_URL}/api/agents/fire-recs/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        risk_profile: riskProfile,
        sip_amount: 10000,
        annual_income: annualIncome,
        age,
        has_term_insurance: hasTermInsurance,
        has_health_insurance: hasHealthInsurance,
        call_type: 'prefetch',
      }),
    }).then(async (res) => {
      if (!res.ok) {
        if (res.status === 429) console.log('[FireRecs Prefetch] Daily prefetch limit reached, skipping.');
        return;
      }
      const json = await res.json();
      if (json.status !== 'ready' || !json.data) return;
      
      if (json.data.attempts_remaining !== undefined) {
         console.log(`[FireRecs Prefetch] Prefetch attempts remaining today: ${json.data.attempts_remaining}`);
      }
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('fire_recommendations').upsert({
        user_id: userId,
        risk_profile: riskProfile,
        status: 'ready',
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt,
        sip_funds: json.data.sip_funds,
        insurance: json.data.insurance,
        ai_summary: json.data.ai_summary,
      }, { onConflict: 'user_id,risk_profile' });
      console.log('[FireRecs Prefetch] Background cache primed ✅');
    }).catch(() => {
      // silent fail
    }).finally(() => {
      _prefetchInProgress.delete(key);
    });

  } catch {
    _prefetchInProgress.delete(key);
  }
}
