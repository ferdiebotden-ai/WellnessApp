-- Fix RLS policies to use raw JWT claim instead of auth.uid()
--
-- Problem: auth.uid() internally tries to cast the JWT 'sub' claim to UUID.
-- Firebase UIDs are NOT UUIDs, so this fails with:
--   "invalid input syntax for type uuid: FUrI5W0vMWgLhbWJoFHO032suGU2"
--
-- Solution: Use current_setting('request.jwt.claim.sub', true) which returns
-- the raw text value without attempting UUID cast.

BEGIN;

-- ============================================================================
-- FIX 1: users table RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
    );

CREATE POLICY "Users can insert themselves"
    ON public.users FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
    );

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = firebase_uid
    );

-- ============================================================================
-- FIX 2: module_enrollment table RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.module_enrollment;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.module_enrollment;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.module_enrollment;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.module_enrollment;

CREATE POLICY "Users can view own enrollments"
    ON public.module_enrollment FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert own enrollments"
    ON public.module_enrollment FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can update own enrollments"
    ON public.module_enrollment FOR UPDATE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can delete own enrollments"
    ON public.module_enrollment FOR DELETE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

-- ============================================================================
-- FIX 3: user_push_tokens table RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can select own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_push_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.user_push_tokens;

CREATE POLICY "Users can select own tokens"
    ON public.user_push_tokens FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can insert own tokens"
    ON public.user_push_tokens FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can update own tokens"
    ON public.user_push_tokens FOR UPDATE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

CREATE POLICY "Users can delete own tokens"
    ON public.user_push_tokens FOR DELETE
    USING (
        auth.jwt() ->> 'role' = 'service_role'
        OR coalesce(current_setting('request.jwt.claim.sub', true), '') = (
            SELECT firebase_uid FROM public.users WHERE id = user_id
        )
    );

-- ============================================================================
-- FIX 4: Replace trigger function to use raw JWT claim
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_user_mutation_of_restricted_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_firebase_uid TEXT := coalesce(current_setting('request.jwt.claim.sub', true), '');
BEGIN
    -- Only check if the user is updating their own record (not service role)
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
