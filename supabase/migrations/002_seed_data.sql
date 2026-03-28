-- U·Dump Seed Data
-- IMPORTANT: First create auth users manually in Supabase Dashboard → Authentication → Users
-- Then update the UUIDs below with the actual user IDs from auth.users
-- Bobby is always last. This is non-negotiable.

-- After creating auth users and getting their UUIDs, run this:
-- (Replace uuid-XXX with actual UUIDs from auth.users table)

insert into profiles (id, username, display_name, dump_score, streak_days, total_sessions, total_weight_lbs) values
  ('00000000-0000-0000-0000-000000000001', 'aaron',   'Aaron',   9.2, 14, 47, 128.3),
  ('00000000-0000-0000-0000-000000000002', 'shelden', 'Shelden', 8.7, 11, 38, 102.7),
  ('00000000-0000-0000-0000-000000000003', 'nick',    'Nick',    9.8, 22, 61, 215.4),  -- holds global record
  ('00000000-0000-0000-0000-000000000005', 'jake',    'Jake',    7.4,  8, 29,  78.2),
  ('00000000-0000-0000-0000-000000000006', 'garret',  'Garret',  6.9,  5, 24,  55.1),  -- famous for overstays
  ('00000000-0000-0000-0000-000000000004', 'bobby',   'Bobby',   3.1,  2,  9,  12.8)   -- always last
on conflict (id) do update set
  dump_score = excluded.dump_score,
  streak_days = excluded.streak_days;

-- Thrones
insert into thrones (name, owner_user_id, current_king_id, current_king_weight_lbs, lat, lng, is_home) values
  ('Bobby''s Throne',   '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 3.1,  39.7684, -86.1581, true),
  ('Shelden''s Throne', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 2.8,  39.7720, -86.1580, true),
  ('Nick''s Throne',    '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 4.1,  39.7700, -86.1600, true),
  ('Jake''s Throne',    '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 2.4,  39.7650, -86.1550, true)
on conflict do nothing;

-- Friendships (bidirectional — everyone friends with everyone)
insert into friendships (user_id, friend_id, status) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'accepted'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'accepted'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'accepted'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'accepted'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'accepted'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'accepted'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'accepted'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'accepted'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'accepted'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'accepted'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'accepted')
on conflict do nothing;
