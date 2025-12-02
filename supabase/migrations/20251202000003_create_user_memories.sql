-- Migration: Create user_memories table for Phase 2 Memory Layer
-- Purpose: Store user-specific learnings that persist across sessions
-- Required by: Memory Layer component (functions/src/memory/userMemory.ts)

-- Create enum for memory types
CREATE TYPE memory_type AS ENUM (
    'nudge_feedback',           -- How user responds to nudges
    'protocol_effectiveness',   -- Which protocols work for this user
    'preferred_time',           -- When user prefers certain activities
    'stated_preference',        -- Explicit user preferences
    'pattern_detected',         -- AI-detected behavioral patterns
    'preference_constraint'     -- Things user said they can't do
);

CREATE TABLE IF NOT EXISTS public.user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- Memory classification
    type memory_type NOT NULL,

    -- Memory content
    content TEXT NOT NULL,                              -- The actual learning
    context TEXT,                                       -- What triggered this memory

    -- Confidence and evidence
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.5       -- 0-1 confidence score
        CHECK (confidence >= 0 AND confidence <= 1),
    evidence_count INTEGER NOT NULL DEFAULT 1          -- Data points supporting this
        CHECK (evidence_count >= 0),

    -- Decay configuration
    decay_rate NUMERIC(4,3) NOT NULL DEFAULT 0.05      -- Confidence decay per week (0.01-0.1)
        CHECK (decay_rate >= 0.01 AND decay_rate <= 0.1),

    -- Lifecycle
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_decayed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                            -- Optional hard expiration

    -- Metadata
    source_nudge_id TEXT,                              -- Nudge that created this memory
    source_protocol_id TEXT REFERENCES public.protocols(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memories_type ON public.user_memories(type);
CREATE INDEX IF NOT EXISTS idx_user_memories_user_type ON public.user_memories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_user_memories_confidence ON public.user_memories(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_last_used ON public.user_memories(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memories_user_confidence ON public.user_memories(user_id, confidence DESC);

-- Partial index for active (non-expired) memories
CREATE INDEX IF NOT EXISTS idx_user_memories_active ON public.user_memories(user_id, confidence DESC)
    WHERE (expires_at IS NULL OR expires_at > NOW()) AND confidence >= 0.1;

-- Enable Row Level Security
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own memories"
    ON public.user_memories FOR SELECT
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can insert own memories"
    ON public.user_memories FOR INSERT
    WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can update own memories"
    ON public.user_memories FOR UPDATE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

CREATE POLICY "Users can delete own memories"
    ON public.user_memories FOR DELETE
    USING (auth.uid()::text = (SELECT firebase_uid FROM public.users WHERE id = user_id));

-- Service role can do anything (for Cloud Functions)
CREATE POLICY "Service role full access"
    ON public.user_memories FOR ALL
    USING (auth.role() = 'service_role');

-- Function to apply memory decay (called by scheduled job)
CREATE OR REPLACE FUNCTION apply_memory_decay()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    -- Apply decay formula: new_confidence = confidence * (1 - decay_rate)^weeks_since_last_decay
    UPDATE public.user_memories
    SET
        confidence = GREATEST(0, confidence * POWER(1 - decay_rate,
            EXTRACT(EPOCH FROM (NOW() - last_decayed_at)) / (7 * 24 * 60 * 60))),
        last_decayed_at = NOW()
    WHERE last_decayed_at < NOW() - INTERVAL '1 day';

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Function to prune low-confidence and expired memories (max 150 per user)
CREATE OR REPLACE FUNCTION prune_user_memories(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    excess_count INTEGER;
BEGIN
    -- Delete expired memories
    DELETE FROM public.user_memories
    WHERE user_id = target_user_id
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Delete memories with confidence < 0.1
    DELETE FROM public.user_memories
    WHERE user_id = target_user_id
      AND confidence < 0.1;
    deleted_count := deleted_count + ROW_COUNT;

    -- Enforce max 150 memories per user (delete oldest by last_used_at)
    SELECT COUNT(*) - 150 INTO excess_count
    FROM public.user_memories
    WHERE user_id = target_user_id;

    IF excess_count > 0 THEN
        DELETE FROM public.user_memories
        WHERE id IN (
            SELECT id FROM public.user_memories
            WHERE user_id = target_user_id
            ORDER BY last_used_at ASC
            LIMIT excess_count
        );
        deleted_count := deleted_count + excess_count;
    END IF;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Update trigger for last_used_at when memory is accessed
CREATE OR REPLACE FUNCTION update_memory_last_used()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update last_used_at if explicitly not changed (prevents overwrite on bulk updates)
    IF OLD.last_used_at = NEW.last_used_at THEN
        NEW.last_used_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE public.user_memories IS 'Stores user-specific learnings for Memory Layer - max 150 per user with decay';
COMMENT ON COLUMN public.user_memories.type IS '6 memory types: nudge_feedback, protocol_effectiveness, preferred_time, stated_preference, pattern_detected, preference_constraint';
COMMENT ON COLUMN public.user_memories.confidence IS 'Confidence score 0-1, decays over time based on decay_rate';
COMMENT ON COLUMN public.user_memories.decay_rate IS 'Weekly confidence decay rate (0.01-0.1), lower for high-evidence memories';
COMMENT ON COLUMN public.user_memories.evidence_count IS 'Number of data points supporting this memory - higher count reduces decay';
COMMENT ON FUNCTION apply_memory_decay() IS 'Applies time-based confidence decay to all memories';
COMMENT ON FUNCTION prune_user_memories(UUID) IS 'Removes expired/low-confidence memories and enforces 150 max per user';
