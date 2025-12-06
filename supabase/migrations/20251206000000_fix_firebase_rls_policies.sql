-- Fix RLS policies for Firebase-authenticated users
-- The core tables were using auth.uid() = id which fails because
-- auth.uid() returns Firebase UID (text) but id columns are UUID
--
-- Error observed: "invalid input syntax for type uuid: FUrI5W0vMWgLhbWJoFHO032suGU2"
-- This migration fixes RLS on: users, module_enrollment, user_push_tokens

BEGIN;

-- ============================================================================
-- FIX 1: users table RLS policies
-- ============================================================================
-- The 20240710120000_add_user_profile_fields.sql migration created policies
-- that compare auth.uid() (Firebase UID text) with id (UUID column).
-- This fails because PostgreSQL tries to cast text to UUID.

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
-- Also drop the older policy names from 0002_enable_rls.sql if they exist
DROP POLICY IF EXISTS "Users can select their row" ON public.users;
DROP POLICY IF EXISTS "Users can insert their row" ON public.users;
DROP POLICY IF EXISTS "Users can update their row" ON public.users;

CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR auth.uid()::text = firebase_uid
    );

CREATE POLICY "Users can insert themselves"
    ON public.users FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR auth.uid()::text = firebase_uid
    );

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.role() = 'service_role' OR auth.uid()::text = firebase_uid)
    WITH CHECK (auth.role() = 'service_role' OR auth.uid()::text = firebase_uid);

-- ============================================================================
-- FIX 2: module_enrollment table RLS policies
-- ============================================================================
-- The 20251130000000_create_module_enrollment.sql migration created policies
-- that compare auth.uid() with user_id (UUID column).
-- Fix: Join through users table to compare Firebase UID.

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.module_enrollment;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.module_enrollment;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.module_enrollment;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.module_enrollment;
-- Keep the service role policy if it exists
DROP POLICY IF EXISTS "Service role has full access" ON public.module_enrollment;

CREATE POLICY "Users can view own enrollments"
    ON public.module_enrollment FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can insert own enrollments"
    ON public.module_enrollment FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update own enrollments"
    ON public.module_enrollment FOR UPDATE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can delete own enrollments"
    ON public.module_enrollment FOR DELETE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

-- ============================================================================
-- FIX 3: user_push_tokens table RLS policies
-- ============================================================================
-- Same issue: auth.uid() compared with user_id UUID column.

DROP POLICY IF EXISTS "Users can select own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.user_push_tokens;

CREATE POLICY "Users can select own tokens"
    ON public.user_push_tokens FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can insert own tokens"
    ON public.user_push_tokens FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can update own tokens"
    ON public.user_push_tokens FOR UPDATE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

CREATE POLICY "Users can delete own tokens"
    ON public.user_push_tokens FOR DELETE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id)
    );

-- ============================================================================
-- FIX 4: Replace broken trigger function that casts auth.uid() to UUID
-- ============================================================================
-- The trigger function in 20240710120000 does:
--   request_uid UUID := auth.uid();
-- This fails because auth.uid() returns Firebase UID (text), not UUID.

CREATE OR REPLACE FUNCTION public.prevent_user_mutation_of_restricted_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_firebase_uid TEXT := auth.uid()::text;
BEGIN
    -- Only check if the user is updating their own record (not service role)
    -- Compare Firebase UID from JWT with firebase_uid column (both TEXT)
    IF request_firebase_uid = NEW.firebase_uid THEN
        IF NEW.tier IS DISTINCT FROM OLD.tier
            OR NEW.trial_start_date IS DISTINCT FROM OLD.trial_start_date
            OR NEW.trial_end_date IS DISTINCT FROM OLD.trial_end_date THEN
            RAISE EXCEPTION 'Restricted profile fields cannot be updated by the user.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

COMMIT;
