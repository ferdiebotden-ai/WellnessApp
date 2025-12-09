-- Add biometric profile fields for personalized protocol recommendations
-- Collected during onboarding to calibrate HRV baselines and protocol dosing
-- Session 56: PRD v8.1 frontend rebuild

BEGIN;

-- Add birth_date column for age-based personalization
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Add biological_sex column for HRV baseline calibration
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS biological_sex TEXT
CHECK (biological_sex IS NULL OR biological_sex IN (
    'male',
    'female',
    'prefer_not_to_say'
));

-- Add height_cm column for BMI context
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS height_cm SMALLINT
CHECK (height_cm IS NULL OR (height_cm >= 50 AND height_cm <= 300));

-- Add weight_kg column for protocol dosing and tracking
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2)
CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 500));

-- Add timezone column for nudge scheduling
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add weight_updated_at for tracking weight changes over time
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS weight_updated_at TIMESTAMPTZ;

-- Create function to auto-update weight_updated_at
CREATE OR REPLACE FUNCTION update_weight_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.weight_kg IS DISTINCT FROM OLD.weight_kg THEN
        NEW.weight_updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for weight timestamp
DROP TRIGGER IF EXISTS trg_update_weight_timestamp ON public.users;
CREATE TRIGGER trg_update_weight_timestamp
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_weight_timestamp();

-- Add comments for documentation
COMMENT ON COLUMN public.users.birth_date IS 'User birth date for age-based HRV baseline personalization. Null if not provided.';
COMMENT ON COLUMN public.users.biological_sex IS 'Biological sex for HRV baseline calibration: male, female, prefer_not_to_say. Null if not provided.';
COMMENT ON COLUMN public.users.height_cm IS 'User height in centimeters for BMI context. Range: 50-300cm. Null if not provided.';
COMMENT ON COLUMN public.users.weight_kg IS 'User weight in kilograms for protocol dosing. Range: 20-500kg. Auto-updates weight_updated_at on change.';
COMMENT ON COLUMN public.users.timezone IS 'User timezone for nudge scheduling. Auto-detected during onboarding, can be overridden.';
COMMENT ON COLUMN public.users.weight_updated_at IS 'Timestamp of last weight update for tracking weight changes over time.';

-- Create index for timezone (used in nudge scheduling queries)
CREATE INDEX IF NOT EXISTS idx_users_timezone ON public.users(timezone);

COMMIT;
