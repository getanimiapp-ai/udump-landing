-- Auto-friend trigger: every new profile automatically becomes friends with all existing profiles
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.auto_friend_new_user()
RETURNS trigger AS $$
DECLARE
  existing_id uuid;
BEGIN
  FOR existing_id IN SELECT id FROM public.profiles WHERE id != NEW.id LOOP
    INSERT INTO public.friendships (user_id, friend_id, status)
    VALUES (NEW.id, existing_id, 'accepted')
    ON CONFLICT (user_id, friend_id) DO NOTHING;

    INSERT INTO public.friendships (user_id, friend_id, status)
    VALUES (existing_id, NEW.id, 'accepted')
    ON CONFLICT (user_id, friend_id) DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_auto_friend ON public.profiles;
CREATE TRIGGER on_profile_created_auto_friend
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_friend_new_user();
