-- Fix user_protocol_enrollment FK constraint
-- The original migration referenced auth.users(id) but this app uses Firebase Auth,
-- so we need to reference public.users(id) instead.
-- Session 62: Deploy & Verify Enrollment Flow

-- Drop the incorrect FK constraint (referencing auth.users)
ALTER TABLE public.user_protocol_enrollment
    DROP CONSTRAINT IF EXISTS user_protocol_enrollment_user_id_fkey;

-- Add the correct FK constraint (referencing public.users)
ALTER TABLE public.user_protocol_enrollment
    ADD CONSTRAINT user_protocol_enrollment_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.user_protocol_enrollment.user_id IS
    'References public.users(id) - Firebase-authenticated users synced to Supabase';
