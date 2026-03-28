import { create } from 'zustand';
import { supabase } from '../supabase';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  dump_score: number;
  streak_days: number;
  last_session_at: string | null;
  total_sessions: number;
  total_weight_lbs: number;
}

interface UserState {
  profile: Profile | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId: string) => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      set({ profile: data });
    }
    set({ isLoading: false });
  },

  updateProfile: async (updates) => {
    const { profile } = get();
    if (!profile) return;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && data) {
      set({ profile: data });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ profile: null });
  },
}));
