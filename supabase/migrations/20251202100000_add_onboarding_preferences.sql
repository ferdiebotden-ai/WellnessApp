-- Add onboarding preference fields for conversational AI onboarding
-- primary_goal: User's primary wellness focus selected during onboarding
-- wearable_source: Optional wearable device the user tracks with

BEGIN;

-- Add primary_goal column with enum-like constraint
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS primary_goal TEXT
CHECK (primary_goal IS NULL OR primary_goal IN (
    'better_sleep',
    'more_energy',
    'sharper_focus',
    'faster_recovery'
));

-- Add wearable_source column with enum-like constraint
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS wearable_source TEXT
CHECK (wearable_source IS NULL OR wearable_source IN (
    'oura',
    'whoop',
    'apple_health',
    'google_fit',
    'garmin'
));

-- Add comment for documentation
COMMENT ON COLUMN public.users.primary_goal IS 'Primary wellness goal selected during onboarding: better_sleep, more_energy, sharper_focus, faster_recovery';
COMMENT ON COLUMN public.users.wearable_source IS 'Wearable device the user tracks with, selected during onboarding. Null if skipped.';

COMMIT;
