-- Migration: Create weekly_syntheses table for Phase 2 Weekly Synthesis
-- Purpose: Store AI-generated Sunday Briefs (~200 word narratives)
-- Required by: Weekly Synthesis component (functions/src/synthesis/weeklySynthesis.ts)

CREATE TABLE IF NOT EXISTS public.weekly_syntheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Week boundaries
    week_start DATE NOT NULL,                          -- Monday of the week
    week_end DATE NOT NULL,                            -- Sunday of the week

    -- Narrative content (all sections)
    narrative TEXT NOT NULL,                           -- Full ~200 word synthesis
    win_of_week TEXT NOT NULL,                         -- What improved
    area_to_watch TEXT NOT NULL,                       -- What declined
    pattern_insight TEXT,                              -- Correlation detected
    trajectory_prediction TEXT,                        -- If trends continue
    experiment TEXT NOT NULL,                          -- Achievable next step

    -- Supporting metrics snapshot
    metrics_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
     * Expected structure:
     * {
     *   "protocol_adherence": 0-100,
     *   "days_with_completion": 0-7,
     *   "avg_recovery_score": 0-100,
     *   "hrv_trend_percent": -100 to +100,
     *   "sleep_quality_trend_percent": -100 to +100,
     *   "total_protocols_completed": number,
     *   "protocol_breakdown": [{ "protocol_id": string, "completed_days": number }],
     *   "correlations": [{ "protocol": string, "outcome": string, "r": number, "p_value": number }]
     * }
     */

    -- Lifecycle timestamps
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scheduled_delivery_at TIMESTAMPTZ,                 -- When to deliver (Sunday 9am user timezone)
    delivered_at TIMESTAMPTZ,                          -- When push notification sent
    read_at TIMESTAMPTZ,                               -- When user opened it

    -- Generation metadata
    model_used TEXT,                                   -- AI model version
    generation_duration_ms INTEGER,                    -- How long generation took
    data_days_available INTEGER,                       -- How many days of data were available

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, week_start)                        -- One synthesis per user per week
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_weekly_syntheses_user_id ON public.weekly_syntheses(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_syntheses_week ON public.weekly_syntheses(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_syntheses_user_week ON public.weekly_syntheses(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_syntheses_delivery ON public.weekly_syntheses(scheduled_delivery_at)
    WHERE delivered_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_weekly_syntheses_unread ON public.weekly_syntheses(user_id, delivered_at)
    WHERE read_at IS NULL AND delivered_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.weekly_syntheses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own syntheses"
    ON public.weekly_syntheses FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update read status"
    ON public.weekly_syntheses FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id))
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

-- Service role can do anything (for Cloud Functions)
CREATE POLICY "Service role full access"
    ON public.weekly_syntheses FOR ALL
    USING (auth.role() = 'service_role');

-- Helper function to get the Monday of a given date's week
CREATE OR REPLACE FUNCTION get_week_monday(input_date DATE)
RETURNS DATE AS $$
BEGIN
    -- ISO week: Monday is day 1
    RETURN input_date - (EXTRACT(ISODOW FROM input_date) - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to get the Sunday of a given date's week
CREATE OR REPLACE FUNCTION get_week_sunday(input_date DATE)
RETURNS DATE AS $$
BEGIN
    RETURN get_week_monday(input_date) + 6;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comment for documentation
COMMENT ON TABLE public.weekly_syntheses IS 'AI-generated weekly narrative summaries delivered Sunday 9am';
COMMENT ON COLUMN public.weekly_syntheses.narrative IS 'Full ~200 word synthesis in narrative prose (not bullet points)';
COMMENT ON COLUMN public.weekly_syntheses.win_of_week IS 'What improved this week, with specific numbers';
COMMENT ON COLUMN public.weekly_syntheses.area_to_watch IS 'What declined or needs attention';
COMMENT ON COLUMN public.weekly_syntheses.pattern_insight IS 'Correlation detected in user data';
COMMENT ON COLUMN public.weekly_syntheses.trajectory_prediction IS 'Prediction if current trends continue';
COMMENT ON COLUMN public.weekly_syntheses.experiment IS 'Achievable action for next week (no new equipment required)';
COMMENT ON COLUMN public.weekly_syntheses.metrics_summary IS 'JSON snapshot of weekly metrics used to generate synthesis';
COMMENT ON FUNCTION get_week_monday(DATE) IS 'Returns the Monday of the week containing the given date';
COMMENT ON FUNCTION get_week_sunday(DATE) IS 'Returns the Sunday of the week containing the given date';
