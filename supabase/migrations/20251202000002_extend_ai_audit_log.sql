-- Migration: Extend ai_audit_log table for Phase 2
-- Purpose: Add missing columns and Phase 2 fields (confidence scoring, suppression tracking)
-- Note: Table already exists with some columns, this adds missing ones

-- Add columns if they don't exist (safe for existing tables)
DO $$
BEGIN
    -- Core columns that code expects
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'prompt') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN prompt TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'response') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN response TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'reasoning') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN reasoning TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'citations') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN citations TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'module_id') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN module_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'protocol_id') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN protocol_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'conversation_id') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN conversation_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'user_feedback') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN user_feedback TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'created_at') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Phase 2: Confidence Scoring columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'confidence_score') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN confidence_score NUMERIC(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'confidence_factors') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN confidence_factors JSONB;
    END IF;

    -- Phase 2: Suppression tracking columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'was_suppressed') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN was_suppressed BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'suppression_rule') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN suppression_rule TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'suppression_reason') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN suppression_reason TEXT;
    END IF;

    -- Phase 2: Memory context tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_audit_log' AND column_name = 'memory_ids_used') THEN
        ALTER TABLE public.ai_audit_log ADD COLUMN memory_ids_used UUID[];
    END IF;
END $$;

-- Create indexes for common query patterns (IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_user_id ON public.ai_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created_at ON public.ai_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_decision_type ON public.ai_audit_log(decision_type);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_user_feedback ON public.ai_audit_log(user_feedback) WHERE user_feedback IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_suppressed ON public.ai_audit_log(was_suppressed) WHERE was_suppressed = TRUE;

-- Comment for documentation
COMMENT ON COLUMN public.ai_audit_log.confidence_score IS 'AI confidence in recommendation (0-1), Phase 2 Confidence Scoring component';
COMMENT ON COLUMN public.ai_audit_log.confidence_factors IS 'JSON breakdown of scoring factors: protocol_fit, memory_support, timing_fit, conflict_risk, evidence_strength';
COMMENT ON COLUMN public.ai_audit_log.was_suppressed IS 'Whether nudge was suppressed by Suppression Engine rules';
COMMENT ON COLUMN public.ai_audit_log.suppression_rule IS 'Which suppression rule blocked delivery (e.g., daily_cap, quiet_hours)';
COMMENT ON COLUMN public.ai_audit_log.memory_ids_used IS 'Array of user_memory IDs that influenced this decision';
