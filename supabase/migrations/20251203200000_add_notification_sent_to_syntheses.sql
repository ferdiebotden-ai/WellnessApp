-- Add notification_sent column to weekly_syntheses
-- Tracks whether push notification has been sent for this synthesis

ALTER TABLE public.weekly_syntheses
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- Add word_count column for narrative validation
ALTER TABLE public.weekly_syntheses
ADD COLUMN IF NOT EXISTS word_count INTEGER;

-- Add sections_detected for tracking which narrative sections were included
ALTER TABLE public.weekly_syntheses
ADD COLUMN IF NOT EXISTS sections_detected TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.weekly_syntheses.notification_sent IS 'Whether push notification has been sent';
COMMENT ON COLUMN public.weekly_syntheses.word_count IS 'Word count of the narrative';
COMMENT ON COLUMN public.weekly_syntheses.sections_detected IS 'Array of detected sections: Win, Watch, Pattern, Trajectory, Experiment';
