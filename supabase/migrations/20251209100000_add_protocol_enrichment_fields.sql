-- Migration: Add enrichment fields to protocols table
-- Enables "Why This Works", personalization parameters, and study sources
-- Session 59: Protocol Data Enrichment & Personalization
-- Date: December 9, 2025

-- Add mechanism_description: Scientific explanation for "Why This Works" panel
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS mechanism_description text;

-- Add duration_minutes: How long the protocol takes
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS duration_minutes smallint;

-- Add frequency_per_week: Recommended days per week (1-7)
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS frequency_per_week smallint
CHECK (frequency_per_week IS NULL OR (frequency_per_week >= 1 AND frequency_per_week <= 7));

-- Add parameter_ranges: Min/optimal/max for protocol parameters
-- Example: {"intensity": {"min": 1000, "optimal": 5000, "max": 10000, "unit": "lux"}}
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS parameter_ranges jsonb DEFAULT '{}'::jsonb;

-- Add implementation_rules: Decision tree for personalized nudges
-- Example: {"if_sunny_outdoor": "Perfect! Just 10 minutes needed.", ...}
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS implementation_rules jsonb DEFAULT '{}'::jsonb;

-- Add success_metrics: Expected outcomes with baselines and targets
-- Example: [{"metric": "Sleep efficiency", "baseline": "75%", "target": "85%+", "timeline": "2-4 weeks"}]
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS success_metrics jsonb DEFAULT '[]'::jsonb;

-- Add study_sources: Detailed citation info (author, year, DOI)
-- Example: [{"author": "Balban et al.", "year": 2023, "title": "...", "doi": "..."}]
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS study_sources jsonb DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.protocols.mechanism_description IS 'Scientific explanation of why this protocol works (melanopsin signaling, HPA axis, etc.)';
COMMENT ON COLUMN public.protocols.duration_minutes IS 'Typical duration in minutes for one session';
COMMENT ON COLUMN public.protocols.frequency_per_week IS 'Recommended frequency in days per week (1-7)';
COMMENT ON COLUMN public.protocols.parameter_ranges IS 'JSONB with min/optimal/max ranges for protocol parameters (intensity, duration, timing, etc.)';
COMMENT ON COLUMN public.protocols.implementation_rules IS 'JSONB decision tree for context-aware nudge generation';
COMMENT ON COLUMN public.protocols.success_metrics IS 'JSONB array of expected outcomes with baselines, targets, and timelines';
COMMENT ON COLUMN public.protocols.study_sources IS 'JSONB array of detailed study citations (author, year, title, DOI)';

-- Create index for protocols with mechanism descriptions (for filtering completeness)
CREATE INDEX IF NOT EXISTS idx_protocols_has_mechanism ON public.protocols ((mechanism_description IS NOT NULL))
WHERE mechanism_description IS NOT NULL;
