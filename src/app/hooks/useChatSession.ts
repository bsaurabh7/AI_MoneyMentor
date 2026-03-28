import { useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { CollectedData } from './useCollectedData';

/**
 * Debounced auto-save hook for chat sessions.
 * Saves {current_step, collected_data} to Supabase every 2s after a change.
 */



export function useChatSession(
  userId: string | undefined,
  collected: CollectedData,
  step: string
) {
  const saveSession = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase.from('chat_sessions').upsert(
      {
        user_id: userId,
        current_step: step,
        collected_data: collected,
        last_updated: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
    if (error) console.error('[useChatSession] Save error:', error);
  }, [userId, collected, step]);

  useEffect(() => {
    if (!userId) return;
    const timer = setTimeout(saveSession, 2000);
    return () => clearTimeout(timer);
  }, [collected, step, saveSession, userId]);

  return { saveSession };
}

/**
 * One-shot fetch of the saved session for a user.
 * Returns null if no session exists.
 */
export async function fetchChatSession(userId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('current_step, collected_data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('[fetchChatSession] Error:', error);
    return null;
  }
  return data;
}
