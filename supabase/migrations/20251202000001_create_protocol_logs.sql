-- Migration: Create protocol_logs table
-- Purpose: Store user protocol completion history for Phase 2 Brain Layer
-- Required by: onProtocolLogWritten.ts, analyzeNudgeFeedback.ts, outcomeCorrelation.ts

CREATE TABLE IF NOT EXISTS public.protocol_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    protocol_id TEXT NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
    module_id TEXT REFERENCES public.modules(id) ON DELETE SET NULL,
    module_enrollment_id UUID REFERENCES public.module_enrollment(id) ON DELETE SET NULL,

    -- Completion details
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('schedule', 'manual', 'nudge', 'auto')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'skipped', 'partial')),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,

    -- Phase 2: Feedback & context
    nudge_id TEXT,                                      -- If triggered by nudge
    difficulty_rating SMALLINT CHECK (difficulty_rating BETWEEN 1 AND 5),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_protocol_logs_user_id ON public.protocol_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_protocol_logs_protocol_id ON public.protocol_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_protocol_logs_module_id ON public.protocol_logs(module_id);
CREATE INDEX IF NOT EXISTS idx_protocol_logs_logged_at ON public.protocol_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_protocol_logs_user_logged ON public.protocol_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_protocol_logs_user_protocol ON public.protocol_logs(user_id, protocol_id);

-- Enable Row Level Security
ALTER TABLE public.protocol_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own logs
CREATE POLICY "Users can view own protocol logs"
    ON public.protocol_logs FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own protocol logs"
    ON public.protocol_logs FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

-- Service role can do anything (for Cloud Functions)
CREATE POLICY "Service role full access"
    ON public.protocol_logs FOR ALL
    USING (auth.role() = 'service_role');

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_protocol_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protocol_logs_updated_at
    BEFORE UPDATE ON public.protocol_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_protocol_logs_updated_at();

-- Comment for documentation
COMMENT ON TABLE public.protocol_logs IS 'Stores user protocol completion history for tracking adherence and outcomes';
COMMENT ON COLUMN public.protocol_logs.source IS 'How the log was created: schedule (daily scheduler), manual (user initiated), nudge (from AI nudge), auto (automated)';
COMMENT ON COLUMN public.protocol_logs.difficulty_rating IS 'User-provided difficulty rating 1-5 (optional, for Phase 2 feedback)';
COMMENT ON COLUMN public.protocol_logs.nudge_id IS 'Reference to the nudge that triggered this completion (Phase 2)';
