-- Migration: Create wearable_data_archive table
-- Purpose: Store normalized wearable data for HRV, sleep, and recovery tracking
-- Required by: wearablesSync.ts, weeklySynthesis.ts, privacy.ts

CREATE TABLE IF NOT EXISTS public.wearable_data_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Source and timing
    source TEXT NOT NULL CHECK (source IN ('apple_health', 'google_fit', 'oura', 'whoop', 'garmin')),
    recorded_at TIMESTAMPTZ NOT NULL,

    -- HRV metrics
    hrv_score INTEGER CHECK (hrv_score BETWEEN 0 AND 100),
    hrv_rmssd_ms NUMERIC(6,2),       -- RMSSD in milliseconds
    hrv_sdnn_ms NUMERIC(6,2),        -- SDNN in milliseconds

    -- Sleep metrics
    sleep_hours NUMERIC(4,2),         -- Total sleep duration

    -- Other vitals
    resting_hr_bpm NUMERIC(5,1),      -- Resting heart rate
    steps INTEGER,

    -- Derived scores
    readiness_score INTEGER CHECK (readiness_score BETWEEN 0 AND 100),

    -- Raw data preservation
    raw_payload JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_wearable_user_id ON public.wearable_data_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_recorded_at ON public.wearable_data_archive(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_user_recorded ON public.wearable_data_archive(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_user_source ON public.wearable_data_archive(user_id, source);

-- Composite index for weekly aggregation queries
CREATE INDEX IF NOT EXISTS idx_wearable_user_week ON public.wearable_data_archive(user_id, recorded_at)
    WHERE hrv_score IS NOT NULL OR sleep_hours IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.wearable_data_archive ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view own wearable data"
    ON public.wearable_data_archive FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own wearable data"
    ON public.wearable_data_archive FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

-- Service role can do anything (for Cloud Functions)
CREATE POLICY "Service role full access"
    ON public.wearable_data_archive FOR ALL
    USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.wearable_data_archive IS 'Stores normalized wearable data from health platforms for HRV/sleep/recovery tracking';
COMMENT ON COLUMN public.wearable_data_archive.source IS 'Wearable platform: apple_health, google_fit, oura, whoop, garmin';
COMMENT ON COLUMN public.wearable_data_archive.hrv_score IS 'Normalized HRV score 0-100 derived from RMSSD';
COMMENT ON COLUMN public.wearable_data_archive.hrv_rmssd_ms IS 'Root Mean Square of Successive Differences in milliseconds';
COMMENT ON COLUMN public.wearable_data_archive.hrv_sdnn_ms IS 'Standard Deviation of NN intervals in milliseconds';
COMMENT ON COLUMN public.wearable_data_archive.readiness_score IS 'Composite readiness score: (HRV * 0.6) + (Sleep * 0.4) * 100';
