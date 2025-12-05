-- Add is_primary column to module_enrollment
-- Allows tracking which module is the user's primary focus module

ALTER TABLE public.module_enrollment
ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Index for efficient lookup of primary module
CREATE INDEX IF NOT EXISTS idx_module_enrollment_is_primary
ON public.module_enrollment (user_id, is_primary)
WHERE is_primary = true;

COMMENT ON COLUMN public.module_enrollment.is_primary IS
'Whether this is the users primary focus module selected during onboarding';
