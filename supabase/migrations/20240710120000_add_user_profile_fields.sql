BEGIN;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'trial',
    ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS "healthMetrics" JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS "earnedBadges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE public.users
    ALTER COLUMN tier SET DEFAULT 'trial',
    ALTER COLUMN onboarding_complete SET DEFAULT FALSE,
    ALTER COLUMN preferences SET DEFAULT '{}'::jsonb,
    ALTER COLUMN "healthMetrics" SET DEFAULT '{}'::jsonb,
    ALTER COLUMN "earnedBadges" SET DEFAULT ARRAY[]::TEXT[];

UPDATE public.users
SET preferences = '{}'::jsonb
WHERE preferences IS NULL;

UPDATE public.users
SET "healthMetrics" = '{}'::jsonb
WHERE "healthMetrics" IS NULL;

UPDATE public.users
SET "earnedBadges" = ARRAY[]::TEXT[]
WHERE "earnedBadges" IS NULL;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.prevent_user_mutation_of_restricted_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_uid UUID := auth.uid();
BEGIN
    IF request_uid = NEW.id THEN
        IF NEW.tier IS DISTINCT FROM OLD.tier
            OR NEW.trial_start_date IS DISTINCT FROM OLD.trial_start_date
            OR NEW.trial_end_date IS DISTINCT FROM OLD.trial_end_date THEN
            RAISE EXCEPTION 'Restricted profile fields cannot be updated by the user.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_user_restricted_field_mutations ON public.users;
CREATE TRIGGER prevent_user_restricted_field_mutations
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_user_mutation_of_restricted_fields();

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (auth.role() = 'service_role' OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
CREATE POLICY "Users can insert themselves"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.role() = 'service_role' OR auth.uid() = id)
    WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

COMMIT;
