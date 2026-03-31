import { create } from 'zustand';
import { supabase } from '../supabase';
import { checkAndUnlockAchievements } from '../utils/checkAchievements';
import { notifyFriends } from '../utils/notifications';

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
  endSession: (weightBefore: number | null, weightAfter: number | null, clogged?: boolean) => Promise<SessionResult | null>;
  cancelSession: () => Promise<void>;
}

export interface SessionResult {
  id: string;
  durationSeconds: number;
  weightDelta: number | null;
  isPersonalRecord: boolean;
  throneClaimed: boolean;
  throneId: string | null;
  newAchievements: string[];
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

      // Notify friends: friend is now active
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();
      const displayName = profile?.display_name || profile?.username || 'Someone';

      let locationName = 'Home';
      if (throneId) {
        const { data: throne } = await supabase
          .from('thrones')
          .select('name')
          .eq('id', throneId)
          .single();
        locationName = throne?.name ?? 'Unknown';
      }
      notifyFriends(user.id, 'friend_active', { name: displayName, location: locationName, mins: 0 });
    } else {
      console.error('Failed to start session:', error);
      set({ isStarting: false });
    }
  },

  endSession: async (weightBefore: number | null, weightAfter: number | null, clogged: boolean = false) => {
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

    const { data, error: updateError } = await supabase
      .from('dump_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        weight_before_lbs: weightBefore,
        weight_after_lbs: weightAfter,
        weight_delta_lbs: weightDelta,
        is_personal_record: isPersonalRecord,
        throne_claimed: throneClaimed,
        clogged,
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (updateError || !data) {
      console.error('Failed to save session:', updateError);
      return null;
    }

    set({ activeSession: null });

    // Fetch user display name for notification copy
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();
    const displayName = profile?.display_name || profile?.username || 'Someone';

    // Notify friends: record broken
    if (isPersonalRecord && weightDelta != null) {
      notifyFriends(user.id, 'record_broken', { name: displayName, lbs: weightDelta });
    }

    // Notify friends: throne claimed
    if (throneClaimed && activeSession.throneId) {
      const { data: throneInfo } = await supabase
        .from('thrones')
        .select('name')
        .eq('id', activeSession.throneId)
        .single();
      notifyFriends(user.id, 'throne_claimed', {
        name: displayName,
        location: throneInfo?.name ?? 'a throne',
        lbs: weightDelta ?? 0,
        mins: Math.floor(durationSeconds / 60),
      });
    }

    // Clog notifications — maximum shame
    if (clogged) {
      let locationName = 'home';
      let throneOwnerId: string | null = null;

      if (activeSession.throneId) {
        const { data: throneInfo } = await supabase
          .from('thrones')
          .select('name, owner_user_id')
          .eq('id', activeSession.throneId)
          .single();
        if (throneInfo) {
          locationName = throneInfo.name;
          throneOwnerId = throneInfo.owner_user_id;
        }
      }

      // Is this someone else's throne?
      if (throneOwnerId && throneOwnerId !== user.id) {
        // Notify everyone: war crime committed
        notifyFriends(user.id, 'clog_away', { name: displayName, location: locationName });
        // Special notification to the throne owner — their toilet was violated
        notifyFriends(user.id, 'clog_victim', { perpetrator: displayName }, throneOwnerId);
      } else {
        // Clogged your own toilet — still shameful
        notifyFriends(user.id, 'clog_own', { name: displayName });
      }
    }

    // Count total sessions for achievement checks
    const { count: totalSessions } = await supabase
      .from('dump_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('ended_at', 'is', null);

    // Compute current streak (consecutive days with at least one session, ending today)
    const { data: recentSessions } = await supabase
      .from('dump_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(60);

    let streakDays = 0;
    if (recentSessions && recentSessions.length > 0) {
      const daySet = new Set(
        recentSessions.map((s) => new Date(s.started_at).toDateString()),
      );
      const today = new Date();
      let cursor = new Date(today);
      while (daySet.has(cursor.toDateString())) {
        streakDays++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }

    // Determine if clog was at someone else's throne
    let cloggedAway = false;
    if (clogged && activeSession.throneId) {
      const { data: throneCheck } = await supabase
        .from('thrones')
        .select('owner_user_id')
        .eq('id', activeSession.throneId)
        .single();
      if (throneCheck && throneCheck.owner_user_id && throneCheck.owner_user_id !== user.id) {
        cloggedAway = true;
      }
    }

    // Count total clogs for serial clogger achievement
    let totalClogs = 0;
    if (clogged) {
      const { count } = await supabase
        .from('dump_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('clogged', true);
      totalClogs = count ?? 0;
    }

    const newAchievements = await checkAndUnlockAchievements(
      {
        id: data.id,
        user_id: user.id,
        started_at: data.started_at,
        duration_seconds: durationSeconds,
        weight_delta_lbs: weightDelta,
        throne_claimed: throneClaimed,
        clogged,
        cloggedAway,
      },
      { totalSessions: totalSessions ?? 1, streakDays, totalClogs },
    );

    // Streak milestone notifications (7, 30 day)
    if (newAchievements.includes('STREAK_7')) {
      notifyFriends(user.id, 'streak_milestone', { days: 7 });
    }
    if (newAchievements.includes('STREAK_30')) {
      notifyFriends(user.id, 'streak_milestone', { days: 30 });
    }

    return {
      id: data.id,
      durationSeconds,
      weightDelta,
      isPersonalRecord,
      throneClaimed,
      throneId: activeSession.throneId,
      newAchievements,
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
