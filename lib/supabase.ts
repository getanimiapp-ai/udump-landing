import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          dump_score: number;
          streak_days: number;
          last_session_at: string | null;
          total_sessions: number;
          total_weight_lbs: number;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          dump_score?: number;
          streak_days?: number;
          last_session_at?: string | null;
          total_sessions?: number;
          total_weight_lbs?: number;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      dump_sessions: {
        Row: {
          id: string;
          user_id: string;
          throne_id: string | null;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          weight_before_lbs: number | null;
          weight_after_lbs: number | null;
          weight_delta_lbs: number | null;
          is_personal_record: boolean;
          throne_claimed: boolean;
          dump_score_snapshot: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          throne_id?: string | null;
          started_at: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          weight_before_lbs?: number | null;
          weight_after_lbs?: number | null;
          weight_delta_lbs?: number | null;
          is_personal_record?: boolean;
          throne_claimed?: boolean;
          dump_score_snapshot?: number | null;
        };
        Update: Partial<Database['public']['Tables']['dump_sessions']['Insert']>;
      };
      thrones: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string | null;
          current_king_id: string | null;
          current_king_weight_lbs: number | null;
          current_king_session_id: string | null;
          lat: number | null;
          lng: number | null;
          is_home: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          owner_user_id?: string | null;
          current_king_id?: string | null;
          current_king_weight_lbs?: number | null;
          current_king_session_id?: string | null;
          lat?: number | null;
          lng?: number | null;
          is_home?: boolean;
        };
        Update: Partial<Database['public']['Tables']['thrones']['Insert']>;
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
        };
        Insert: {
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
        };
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_key: string;
          unlocked_at: string;
          session_id: string | null;
        };
        Insert: {
          user_id: string;
          achievement_key: string;
          session_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
      };
      notification_events: {
        Row: {
          id: string;
          from_user_id: string | null;
          to_user_id: string | null;
          type: string;
          session_id: string | null;
          throne_id: string | null;
          payload: Record<string, unknown> | null;
          sent_at: string;
          read_at: string | null;
        };
        Insert: {
          from_user_id?: string | null;
          to_user_id?: string | null;
          type: string;
          session_id?: string | null;
          throne_id?: string | null;
          payload?: Record<string, unknown> | null;
        };
        Update: Partial<Database['public']['Tables']['notification_events']['Insert']>;
      };
    };
  };
};
