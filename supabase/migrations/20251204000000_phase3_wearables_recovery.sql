-- Migration: Phase 3 - Wearable Data Infrastructure & Recovery Score System
-- Purpose: Create tables for daily metrics, user baselines, recovery scores, OAuth integrations, and wake events
-- Required by: Phase 3 components (Oura OAuth, Recovery Engine, Wake Detection, Calendar Integration)
-- Author: Claude Opus 4.5 (Session 35)
-- Date: December 4, 2025

-- =============================================================================
-- TABLE 1: daily_metrics
-- Normalized wearable data from any source (Oura, HealthKit, Health Connect, etc.)
-- This is the canonical format for all wearable data in Apex OS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Sleep metrics
    sleep_duration_hours NUMERIC(4,2),           -- e.g., 7.50
    sleep_efficiency INTEGER CHECK (sleep_efficiency BETWEEN 0 AND 100),
    sleep_onset_minutes INTEGER,                  -- Time to fall asleep
    bedtime_start TIMESTAMPTZ,
    bedtime_end TIMESTAMPTZ,

    -- Sleep stages (percentages of total sleep)
    rem_percentage INTEGER CHECK (rem_percentage BETWEEN 0 AND 100),
    deep_percentage INTEGER CHECK (deep_percentage BETWEEN 0 AND 100),
    light_percentage INTEGER CHECK (light_percentage BETWEEN 0 AND 100),
    awake_percentage INTEGER CHECK (awake_percentage BETWEEN 0 AND 100),

    -- Heart metrics
    hrv_avg NUMERIC(6,2),                         -- RMSSD in milliseconds
    hrv_method TEXT CHECK (hrv_method IN ('rmssd', 'sdnn')),
    rhr_avg NUMERIC(5,1),                         -- Resting heart rate in bpm
    respiratory_rate_avg NUMERIC(4,1),            -- Breaths per minute

    -- Activity metrics
    steps INTEGER,
    active_minutes INTEGER,
    active_calories INTEGER,

    -- Temperature
    temperature_deviation NUMERIC(4,2),           -- Celsius deviation from baseline

    -- Recovery (calculated by RecoveryEngine, not raw)
    recovery_score INTEGER CHECK (recovery_score BETWEEN 0 AND 100),
    recovery_confidence NUMERIC(3,2) CHECK (recovery_confidence BETWEEN 0 AND 1),

    -- Metadata
    wearable_source TEXT NOT NULL CHECK (wearable_source IN (
        'oura', 'apple_health', 'health_connect', 'garmin', 'fitbit', 'whoop', 'manual'
    )),
    raw_payload JSONB DEFAULT '{}'::jsonb,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one record per user per date
    UNIQUE(user_id, date)
);

-- Indexes for daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_source ON public.daily_metrics(user_id, wearable_source);

-- Partial index for recovery score queries
CREATE INDEX IF NOT EXISTS idx_daily_metrics_recovery ON public.daily_metrics(user_id, date DESC)
    WHERE recovery_score IS NOT NULL;

-- Enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_metrics
CREATE POLICY "Users can view own daily metrics"
    ON public.daily_metrics FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own daily metrics"
    ON public.daily_metrics FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own daily metrics"
    ON public.daily_metrics FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Service role full access to daily_metrics"
    ON public.daily_metrics FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.daily_metrics IS 'Normalized daily wearable data from any source - canonical format for Phase 3';
COMMENT ON COLUMN public.daily_metrics.hrv_avg IS 'Heart Rate Variability average (RMSSD in milliseconds)';
COMMENT ON COLUMN public.daily_metrics.recovery_score IS 'Calculated by RecoveryEngine: weighted formula (HRV 40%, RHR 25%, Sleep 30%, Temp penalty)';


-- =============================================================================
-- TABLE 2: user_baselines
-- 14-day rolling baseline for personalized recovery calculation
-- One record per user, updated daily
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,

    -- HRV baseline (log-transformed for statistical accuracy)
    hrv_ln_mean NUMERIC(8,4),                     -- Natural log of RMSSD mean
    hrv_ln_std_dev NUMERIC(8,4),                  -- Std dev of ln(RMSSD)
    hrv_coefficient_of_variation NUMERIC(5,2),    -- CV in percentage (2-20% is normal)
    hrv_method TEXT CHECK (hrv_method IN ('rmssd', 'sdnn')),
    hrv_sample_count INTEGER DEFAULT 0,

    -- RHR baseline
    rhr_mean NUMERIC(5,1),                        -- BPM
    rhr_std_dev NUMERIC(5,2),                     -- Typically 2-4 bpm
    rhr_sample_count INTEGER DEFAULT 0,

    -- Respiratory rate baseline
    respiratory_rate_mean NUMERIC(4,1),           -- Breaths per minute
    respiratory_rate_std_dev NUMERIC(4,2),

    -- Sleep baseline
    sleep_duration_target_minutes INTEGER,        -- 75th percentile of user's sleep

    -- Temperature baseline
    temperature_baseline_celsius NUMERIC(4,2),

    -- Menstrual cycle tracking (optional, for temperature adjustment)
    menstrual_cycle_tracking BOOLEAN DEFAULT FALSE,
    cycle_day INTEGER CHECK (cycle_day BETWEEN 1 AND 28),
    last_period_start DATE,

    -- Confidence level based on sample count
    confidence_level TEXT DEFAULT 'low' CHECK (confidence_level IN ('low', 'medium', 'high')),

    -- Timestamps
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user_baselines
CREATE INDEX IF NOT EXISTS idx_user_baselines_user_id ON public.user_baselines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_baselines_confidence ON public.user_baselines(confidence_level);

-- Enable RLS
ALTER TABLE public.user_baselines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_baselines
CREATE POLICY "Users can view own baselines"
    ON public.user_baselines FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own baselines"
    ON public.user_baselines FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own baselines"
    ON public.user_baselines FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Service role full access to user_baselines"
    ON public.user_baselines FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.user_baselines IS 'Personal 14-day rolling baselines for recovery calculation';
COMMENT ON COLUMN public.user_baselines.hrv_ln_mean IS 'Natural log of RMSSD mean - HRV is log-normally distributed';
COMMENT ON COLUMN public.user_baselines.confidence_level IS 'low: <7 days, medium: 7-14 days, high: 14+ days of data';


-- =============================================================================
-- TABLE 3: recovery_scores
-- Calculated recovery history for trends and "Why?" panel
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recovery_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Core score
    score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
    confidence NUMERIC(3,2) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    zone TEXT NOT NULL CHECK (zone IN ('red', 'yellow', 'green')),

    -- Component breakdown (for transparency and "Why?" panel)
    components JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Expected structure:
    -- {
    --   "hrv": { "raw": 45.2, "score": 72, "vsBaseline": "+8% above baseline", "weight": 0.40 },
    --   "rhr": { "raw": 52, "score": 85, "vsBaseline": "-2 bpm below baseline", "weight": 0.25 },
    --   "sleepQuality": { "efficiency": 92, "deepPct": 18, "remPct": 22, "score": 88, "weight": 0.20 },
    --   "sleepDuration": { "hours": 7.5, "vsTarget": "On target", "score": 100, "weight": 0.10 },
    --   "respiratoryRate": { "raw": 14.2, "score": 100, "vsBaseline": "Normal range", "weight": 0.05 },
    --   "temperaturePenalty": { "deviation": 0.1, "penalty": 0 }
    -- }

    -- Edge case detection
    edge_cases JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Expected structure:
    -- {
    --   "alcoholDetected": false,
    --   "illnessRisk": "none",
    --   "travelDetected": false,
    --   "menstrualPhaseAdjustment": false
    -- }

    -- Human-readable reasoning
    reasoning TEXT,

    -- Recommendations (protocol activations)
    recommendations JSONB DEFAULT '[]'::jsonb,
    -- Expected structure:
    -- [
    --   { "type": "training", "headline": "Green light for intense training", "body": "...", "protocols": ["hiit", "strength"] },
    --   { "type": "recovery", "headline": "Add NSDR today", "body": "...", "protocols": ["nsdr"], "activateMVD": false }
    -- ]

    -- Data quality
    data_completeness INTEGER CHECK (data_completeness BETWEEN 0 AND 100),
    missing_inputs TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one score per user per date
    UNIQUE(user_id, date)
);

-- Indexes for recovery_scores
CREATE INDEX IF NOT EXISTS idx_recovery_scores_user_date ON public.recovery_scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_zone ON public.recovery_scores(user_id, zone);
CREATE INDEX IF NOT EXISTS idx_recovery_scores_date ON public.recovery_scores(date DESC);

-- Partial index for low-confidence scores (need attention)
CREATE INDEX IF NOT EXISTS idx_recovery_scores_low_confidence ON public.recovery_scores(user_id, date DESC)
    WHERE confidence < 0.7;

-- Enable RLS
ALTER TABLE public.recovery_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recovery_scores
CREATE POLICY "Users can view own recovery scores"
    ON public.recovery_scores FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own recovery scores"
    ON public.recovery_scores FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Service role full access to recovery_scores"
    ON public.recovery_scores FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.recovery_scores IS 'Daily calculated recovery scores with full component breakdown';
COMMENT ON COLUMN public.recovery_scores.zone IS 'Traffic light: red (0-33), yellow (34-66), green (67-100)';
COMMENT ON COLUMN public.recovery_scores.components IS 'Full breakdown for "Why?" panel transparency';


-- =============================================================================
-- TABLE 4: wearable_integrations
-- OAuth tokens for cloud wearable providers (Oura, Garmin, Fitbit, WHOOP)
-- Tokens are encrypted at application level (AES-256)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wearable_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Provider identification
    provider TEXT NOT NULL CHECK (provider IN ('oura', 'garmin', 'fitbit', 'whoop')),

    -- OAuth tokens (encrypted at application level)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT[] DEFAULT '{}',

    -- Webhook configuration (for providers that support it)
    webhook_channel_id TEXT,                      -- Provider's webhook subscription ID
    webhook_resource_id TEXT,
    webhook_expires_at TIMESTAMPTZ,

    -- Sync status
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT DEFAULT 'pending' CHECK (last_sync_status IN ('success', 'failed', 'pending')),
    last_sync_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One integration per provider per user
    UNIQUE(user_id, provider)
);

-- Indexes for wearable_integrations
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_user ON public.wearable_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_provider ON public.wearable_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_user_provider ON public.wearable_integrations(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_sync_status ON public.wearable_integrations(last_sync_status);

-- Partial index for expiring webhooks (need renewal)
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_webhook_expiry ON public.wearable_integrations(webhook_expires_at)
    WHERE webhook_expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.wearable_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wearable_integrations
CREATE POLICY "Users can view own integrations"
    ON public.wearable_integrations FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own integrations"
    ON public.wearable_integrations FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own integrations"
    ON public.wearable_integrations FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own integrations"
    ON public.wearable_integrations FOR DELETE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Service role full access to wearable_integrations"
    ON public.wearable_integrations FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.wearable_integrations IS 'OAuth tokens for cloud wearable providers (Oura, Garmin, Fitbit, WHOOP)';
COMMENT ON COLUMN public.wearable_integrations.access_token_encrypted IS 'AES-256 encrypted access token';
COMMENT ON COLUMN public.wearable_integrations.refresh_token_encrypted IS 'AES-256 encrypted refresh token';


-- =============================================================================
-- TABLE 5: wake_events
-- Wake detection log for Morning Anchor triggering
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wake_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Wake detection
    wake_time TIMESTAMPTZ NOT NULL,
    detection_method TEXT NOT NULL CHECK (detection_method IN (
        'hrv_spike',      -- HRV-based wake detection from wearable
        'movement',       -- Movement spike from wearable
        'phone_unlock',   -- First phone unlock of the day (Lite Mode)
        'manual'          -- User manually indicated wake
    )),
    confidence NUMERIC(3,2) CHECK (confidence BETWEEN 0 AND 1),

    -- Morning Anchor trigger
    morning_anchor_triggered_at TIMESTAMPTZ,
    morning_anchor_skipped BOOLEAN DEFAULT FALSE,
    skip_reason TEXT,

    -- Source metrics (for debugging and ML training)
    source_metrics JSONB DEFAULT '{}'::jsonb,
    -- Expected structure depends on detection_method:
    -- hrv_spike: { "preWakeHrv": 45, "postWakeHrv": 62, "deltaPercent": 37 }
    -- movement: { "movementScore": 85, "duration": 120 }
    -- phone_unlock: { "firstUnlockTime": "2025-12-04T06:15:00Z" }

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One wake event per user per date
    UNIQUE(user_id, date)
);

-- Indexes for wake_events
CREATE INDEX IF NOT EXISTS idx_wake_events_user_date ON public.wake_events(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_wake_events_wake_time ON public.wake_events(wake_time DESC);
CREATE INDEX IF NOT EXISTS idx_wake_events_method ON public.wake_events(detection_method);

-- Partial index for events that triggered Morning Anchor
CREATE INDEX IF NOT EXISTS idx_wake_events_anchored ON public.wake_events(user_id, date DESC)
    WHERE morning_anchor_triggered_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.wake_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wake_events
CREATE POLICY "Users can view own wake events"
    ON public.wake_events FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own wake events"
    ON public.wake_events FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own wake events"
    ON public.wake_events FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Service role full access to wake_events"
    ON public.wake_events FOR ALL
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.wake_events IS 'Wake detection events for Morning Anchor triggering (5-15 min post-wake window)';
COMMENT ON COLUMN public.wake_events.detection_method IS 'How wake was detected: hrv_spike, movement, phone_unlock, or manual';
COMMENT ON COLUMN public.wake_events.morning_anchor_triggered_at IS 'When Morning Anchor nudge was delivered (null if not yet triggered)';


-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Tables created:
-- 1. daily_metrics        - Normalized wearable data (canonical format)
-- 2. user_baselines       - 14-day rolling baseline for recovery calculation
-- 3. recovery_scores      - Calculated recovery history with component breakdown
-- 4. wearable_integrations - OAuth tokens for cloud wearable providers
-- 5. wake_events          - Wake detection log for Morning Anchor
--
-- All tables have:
-- - UUID primary keys
-- - Foreign key to users(id) with CASCADE delete
-- - Row Level Security enabled
-- - Appropriate indexes for query patterns
-- - Comments for documentation
-- =============================================================================
