-- Fix module_enrollment foreign key to reference public.users instead of auth.users
--
-- The original migration incorrectly referenced auth.users which is Supabase's internal
-- auth table. Since this app uses Firebase for authentication, the FK should point to
-- public.users which stores the user profiles with firebase_uid.
--
-- This migration:
-- 1. Drops the incorrect FK constraint
-- 2. Adds the correct FK constraint to public.users

-- Drop the incorrect foreign key constraint
alter table public.module_enrollment
drop constraint if exists module_enrollment_user_id_fkey;

-- Add the correct foreign key constraint to public.users
alter table public.module_enrollment
add constraint module_enrollment_user_id_fkey
foreign key (user_id) references public.users (id) on delete cascade;

-- Verify the constraint is correct
comment on constraint module_enrollment_user_id_fkey on public.module_enrollment is
'Links enrollment to public.users profile (Firebase-authenticated users), not auth.users';
