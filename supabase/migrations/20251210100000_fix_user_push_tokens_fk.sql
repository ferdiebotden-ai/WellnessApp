-- Fix FK constraint on user_push_tokens table
-- Same issue as user_protocol_enrollment: references auth.users but Firebase Auth users are in public.users
-- Session 63: Push Notifications & Schedule Reminders

-- Drop existing constraint that references auth.users
ALTER TABLE public.user_push_tokens DROP CONSTRAINT IF EXISTS user_push_tokens_user_id_fkey;

-- Add new constraint referencing public.users (where Firebase-authenticated users are synced)
ALTER TABLE public.user_push_tokens
  ADD CONSTRAINT user_push_tokens_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Verify: This allows Firebase Auth users (synced to public.users via syncUser()) to save push tokens
