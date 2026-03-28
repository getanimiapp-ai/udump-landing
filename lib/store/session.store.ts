import { create } from 'zustand';
import { supabase } from '../supabase';

interface ActiveSession {
  id: string | null;
  startedAt: Date;
  throneId: string | null;
  weightBefore: number | null;
}

interface SessionState {
  activeSession: ActiveSession | null;
  isStarting: boolean;
  startSession: (throneId?: string) => Promise<void>;
  endSession: (weightBefore: number | null, weightAfter: number | null) => Promise<SessionResult | null>;
  cancelSession: () => Promise<void>;
}

export interface SessionResult {
  id: string;
  durationSeconds: number;
  weightDelta: number | null;
  isPersonalRecord: boolean;
  throneClaimed: boolean;
  throneId: string | null;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isStarting: false,

  startSession: async (throneId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isStarting: true });

    const startedAt = new Date();
    const { data, error } = await supabase
      .from('dump_sessions')
      .insert({
        user_id: user.id,
        throne_id: throneId ?? null,
        started_at: startedAt.toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      set({
        activeSession: {
          id: data.id,
          startedAt,
          throneId: throneId ?? null,
          weightBefore: null,
        },
        isStarting: false,
      });
    } else {
      set({ isStarting: false });
    }
  },

  endSession: async (weightBefore: number | null, weightAfter: number | null) => {
    const { activeSession } = get();
    if (!activeSession?.id) return null;

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - activeSession.startedAt.getTime()) / 1000);
    const weightDelta = weightBefore != null && weightAfter != null
      ? Math.round((weightBefore - weightAfter) * 100) / 100
      : null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if personal record
    let isPersonalRecord = false;
    if (weightDelta != null && weightDelta > 0) {
      const { data: prevBest } = await supabase
        .from('dump_sessions')
        .select('weight_delta_lbs')
        .eq('user_id', user.id)
        .order('weight_delta_lbs', { ascending: false })
        .limit(1)
        .single();

      if (!prevBest || weightDelta > (prevBest.weight_delta_lbs ?? 0)) {
        isPersonalRecord = true;
      }
    }

    // Check throne claiming
    let throneClaimed = false;
    if (activeSession.throneId && weightDelta != null) {
      const { data: throne } = await supabase
        .from('thrones')
        .select('current_king_weight_lbs, current_king_id')
        .eq('id', activeSession.throneId)
        .single();

      if (throne && weightDelta > (throne.current_king_weight_lbs ?? 0)) {
        throneClaimed = true;
        await supabase
          .from('thrones')
          .update({
            current_king_id: user.id,
            current_king_weight_lbs: weightDelta,
            current_king_session_id: activeSession.id,
          })
          .eq('id', activeSession.throneId);
      }
    }

    const { data } = await supabase
      .from('dump_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        weight_before_lbs: weightBefore,
        weight_after_lbs: weightAfter,
        weight_delta_lbs: weightDelta,
        is_personal_record: isPersonalRecord,
        throne_claimed: throneClaimed,
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    set({ activeSession: null });

    if (!data) return null;

    return {
      id: data.id,
      durationSeconds,
      weightDelta,
      isPersonalRecord,
      throneClaimed,
      throneId: activeSession.throneId,
    };
  },

  cancelSession: async () => {
    const { activeSession } = get();
    if (activeSession?.id) {
      await supabase
        .from('dump_sessions')
        .delete()
        .eq('id', activeSession.id);
    }
    set({ activeSession: null });
  },
}));
