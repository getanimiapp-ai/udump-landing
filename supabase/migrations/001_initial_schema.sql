-- U·Dump Initial Schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/kogtiulxfqzuesllwjzz/sql

-- USERS (extends auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  dump_score numeric(4,1) default 0,
  streak_days integer default 0,
  last_session_at timestamptz,
  total_sessions integer default 0,
  total_weight_lbs numeric(8,2) default 0,
  expo_push_token text,
  created_at timestamptz default now()
);

-- SESSIONS
create table public.dump_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  throne_id uuid,  -- FK added after thrones table created
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  weight_before_lbs numeric(5,2),
  weight_after_lbs numeric(5,2),
  weight_delta_lbs numeric(5,2),
  is_personal_record boolean default false,
  throne_claimed boolean default false,
  dump_score_snapshot numeric(4,1),
  created_at timestamptz default now()
);

-- THRONES (GPS locations)
create table public.thrones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references profiles(id),
  current_king_id uuid references profiles(id),
  current_king_weight_lbs numeric(5,2),
  current_king_session_id uuid references dump_sessions(id),
  lat numeric(10,7),
  lng numeric(10,7),
  is_home boolean default false,
  created_at timestamptz default now()
);

-- Add throne FK to sessions now that thrones table exists
alter table public.dump_sessions
  add constraint dump_sessions_throne_id_fkey
  foreign key (throne_id) references thrones(id);

-- FRIENDSHIPS
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  friend_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending','accepted','blocked')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- ACHIEVEMENTS
create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  session_id uuid references dump_sessions(id),
  unique(user_id, achievement_key)
);

-- NOTIFICATION EVENTS
create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  type text check (type in (
    'record_broken',
    'throne_claimed',
    'throne_lost',
    'overstay_60',
    'overstay_120',
    'friend_active',
    'streak_milestone',
    'achievement_unlocked'
  )),
  session_id uuid references dump_sessions(id),
  throne_id uuid references thrones(id),
  payload jsonb,
  sent_at timestamptz default now(),
  read_at timestamptz
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table profiles enable row level security;
alter table dump_sessions enable row level security;
alter table thrones enable row level security;
alter table friendships enable row level security;
alter table user_achievements enable row level security;
alter table notification_events enable row level security;

-- profiles: readable by all authenticated, writable by owner
create policy "profiles_read" on profiles for select using (auth.role() = 'authenticated');
create policy "profiles_write" on profiles for all using (auth.uid() = id);

-- sessions: readable by friends and owner, writable by owner
create policy "sessions_read" on dump_sessions for select using (
  user_id = auth.uid() or
  exists (select 1 from friendships where user_id = auth.uid() and friend_id = dump_sessions.user_id and status = 'accepted')
);
create policy "sessions_write" on dump_sessions for all using (user_id = auth.uid());

-- thrones: readable by all authenticated
create policy "thrones_read" on thrones for select using (auth.role() = 'authenticated');
create policy "thrones_write" on thrones for all using (owner_user_id = auth.uid() or current_king_id = auth.uid());

-- friendships: readable/writable by participants
create policy "friendships_read" on friendships for select using (user_id = auth.uid() or friend_id = auth.uid());
create policy "friendships_write" on friendships for all using (user_id = auth.uid());

-- user_achievements: readable by all, writable by owner
create policy "achievements_read" on user_achievements for select using (auth.role() = 'authenticated');
create policy "achievements_write" on user_achievements for all using (user_id = auth.uid());

-- notification_events: readable/writable by recipient
create policy "notifications_read" on notification_events for select using (to_user_id = auth.uid() or from_user_id = auth.uid());
create policy "notifications_write" on notification_events for insert using (auth.role() = 'authenticated');
create policy "notifications_update" on notification_events for update using (to_user_id = auth.uid());

-- ============================================================
-- STORAGE
-- ============================================================

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "avatar_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatar_upload" on storage.objects for insert using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "avatar_delete" on storage.objects for delete using (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================
-- REALTIME
-- (Enable in Supabase Dashboard → Database → Replication)
-- Tables: dump_sessions, notification_events, thrones
-- ============================================================

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
