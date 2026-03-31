-- Add clogged boolean to dump_sessions
-- Run this in the Supabase SQL Editor

ALTER TABLE public.dump_sessions ADD COLUMN clogged boolean DEFAULT false;
