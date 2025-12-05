-- Migration: Phase 3 - Calendar Integration
-- Purpose: Create tables for calendar integrations and daily calendar metrics
-- Required by: Phase 3 Session 5 (Calendar Integration, MVD heavy_calendar trigger)
-- Author: Claude Opus 4.5 (Session 43)
-- Date: December 5, 2025
--
-- Privacy-First Design:
-- - Never store meeting titles, attendees, or locations
-- - Only store busy blocks and aggregate metrics (hours, count)
-- - Clear messaging: "We only see when you're busy"

-- =============================================================================
-- TABLE 1: calendar_integrations
-- User calendar provider connections (Device or Google Calendar)
-- Supports hybrid approach: device calendar (on-device) or Google OAuth (cloud)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Provider identification
    provider TEXT NOT NULL CHECK (provider IN ('device', 'google_calendar')),

    -- OAuth tokens (encrypted at application level, null for device provider)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMPTZ,

    -- Sync status
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT DEFAULT 'not_connected' CHECK (last_sync_status IN (
        'success', 'failed', 'pending', 'not_connected'
    )),
    last_sync_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One integration per provider per user (user can have both device and google)
    UNIQUE(user_id, provider)
);

-- Indexes for calendar_integrations
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user
    ON public.calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider
    ON public.calendar_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_provider
    ON public.calendar_integrations(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_sync_status
    ON public.calendar_integrations(last_sync_status);

-- Partial index for active integrations (successfully synced)
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_active
    ON public.calendar_integrations(user_id, provider)
    WHERE last_sync_status = 'success';

-- Enable RLS
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_integrations
CREATE POLICY "Users can view own calendar integrations"
    ON public.calendar_integrations FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own calendar integrations"
    ON public.calendar_integrations FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own calendar integrations"
    ON public.calendar_integrations FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own calendar integrations"
    ON public.calendar_integrations FOR DELETE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Service role full access to calendar_integrations"
    ON public.calendar_integrations FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.calendar_integrations IS 'User calendar provider connections for meeting load detection (device or Google Calendar)';
COMMENT ON COLUMN public.calendar_integrations.provider IS 'device = iOS EventKit/Android Provider, google_calendar = Google Calendar OAuth';
COMMENT ON COLUMN public.calendar_integrations.access_token_encrypted IS 'AES-256 encrypted access token (null for device provider)';


-- =============================================================================
-- TABLE 2: daily_calendar_metrics
-- Aggregated meeting load metrics per user per day
-- Privacy-first: Only stores aggregate data (hours, count), never event details
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.daily_calendar_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Meeting load metrics
    meeting_hours NUMERIC(4,2) NOT NULL DEFAULT 0,      -- e.g., 4.50
    meeting_count INTEGER NOT NULL DEFAULT 0,
    back_to_back_count INTEGER NOT NULL DEFAULT 0,      -- Meetings with <15 min gap
    density NUMERIC(4,2) NOT NULL DEFAULT 0,            -- Meetings per workday hour

    -- Threshold flags
    heavy_day BOOLEAN NOT NULL DEFAULT FALSE,           -- >= 4 hours
    overload BOOLEAN NOT NULL DEFAULT FALSE,            -- >= 6 hours
    mvd_activated BOOLEAN NOT NULL DEFAULT FALSE,       -- Whether MVD was triggered

    -- Source tracking
    provider TEXT NOT NULL CHECK (provider IN ('device', 'google_calendar')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One record per user per date
    UNIQUE(user_id, date)
);

-- Indexes for daily_calendar_metrics
CREATE INDEX IF NOT EXISTS idx_daily_calendar_metrics_user_date
    ON public.daily_calendar_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_calendar_metrics_date
    ON public.daily_calendar_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_calendar_metrics_heavy_day
    ON public.daily_calendar_metrics(user_id, heavy_day)
    WHERE heavy_day = TRUE;

-- Partial index for overload days (for analytics)
CREATE INDEX IF NOT EXISTS idx_daily_calendar_metrics_overload
    ON public.daily_calendar_metrics(user_id, date DESC)
    WHERE overload = TRUE;

-- Partial index for MVD-triggered days
CREATE INDEX IF NOT EXISTS idx_daily_calendar_metrics_mvd
    ON public.daily_calendar_metrics(user_id, date DESC)
    WHERE mvd_activated = TRUE;

-- Enable RLS
ALTER TABLE public.daily_calendar_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_calendar_metrics
CREATE POLICY "Users can view own daily calendar metrics"
    ON public.daily_calendar_metrics FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own daily calendar metrics"
    ON public.daily_calendar_metrics FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own daily calendar metrics"
    ON public.daily_calendar_metrics FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Service role full access to daily_calendar_metrics"
    ON public.daily_calendar_metrics FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.daily_calendar_metrics IS 'Daily aggregated meeting load metrics for MVD detection and trends';
COMMENT ON COLUMN public.daily_calendar_metrics.meeting_hours IS 'Total meeting time in hours (sum of busy blocks)';
COMMENT ON COLUMN public.daily_calendar_metrics.back_to_back_count IS 'Number of meetings with <15 min gap between them';
COMMENT ON COLUMN public.daily_calendar_metrics.density IS 'Meetings per workday hour (9-hour window)';
COMMENT ON COLUMN public.daily_calendar_metrics.heavy_day IS 'True if meeting_hours >= 4 (triggers MVD consideration)';
COMMENT ON COLUMN public.daily_calendar_metrics.overload IS 'True if meeting_hours >= 6 (triggers full MVD + message)';
COMMENT ON COLUMN public.daily_calendar_metrics.mvd_activated IS 'Whether MVD was activated due to heavy calendar this day';


-- =============================================================================
-- TRIGGER: Update updated_at timestamp
-- =============================================================================

-- Function to update updated_at (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for calendar_integrations
DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON public.calendar_integrations;
CREATE TRIGGER update_calendar_integrations_updated_at
    BEFORE UPDATE ON public.calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for daily_calendar_metrics
DROP TRIGGER IF EXISTS update_daily_calendar_metrics_updated_at ON public.daily_calendar_metrics;
CREATE TRIGGER update_daily_calendar_metrics_updated_at
    BEFORE UPDATE ON public.daily_calendar_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Tables created:
-- 1. calendar_integrations     - User calendar provider connections (device or Google)
-- 2. daily_calendar_metrics    - Daily aggregated meeting load metrics
--
-- Privacy Features:
-- - Never store meeting titles, attendees, or locations
-- - Only aggregate data (hours, count, back-to-back count)
-- - RLS ensures users only see own data
--
-- Meeting Load Thresholds:
-- - Light: 0-2 hours (full protocols)
-- - Moderate: 2-4 hours (suppress STANDARD nudges)
-- - Heavy: 4-6 hours (activate MVD)
-- - Overload: 6+ hours (full MVD + message)
-- =============================================================================
