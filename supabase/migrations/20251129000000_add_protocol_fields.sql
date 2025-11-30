-- Migration: Add missing fields to protocols table
-- Required by protocolSearch.ts for RAG search functionality
-- Date: November 29, 2025

-- Add description column (full protocol description)
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS description text;

-- Add tier_required column (which subscription tier can access this protocol)
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS tier_required text
CHECK (tier_required IS NULL OR tier_required IN ('core', 'pro', 'elite'));

-- Add benefits column (what benefits users get from this protocol)
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS benefits text;

-- Add constraints column (contraindications or limitations)
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS constraints text;

-- Add citations column (array of scientific citations)
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS citations text[] DEFAULT ARRAY[]::text[];

-- Add is_active column (soft delete / feature flag)
ALTER TABLE public.protocols
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create index for active protocols filtering
CREATE INDEX IF NOT EXISTS idx_protocols_is_active ON public.protocols (is_active) WHERE is_active = true;

-- Create index for tier filtering
CREATE INDEX IF NOT EXISTS idx_protocols_tier_required ON public.protocols (tier_required);

COMMENT ON COLUMN public.protocols.description IS 'Full protocol description with implementation details';
COMMENT ON COLUMN public.protocols.tier_required IS 'Subscription tier required to access: core, pro, or elite';
COMMENT ON COLUMN public.protocols.benefits IS 'Expected benefits from following this protocol';
COMMENT ON COLUMN public.protocols.constraints IS 'Contraindications, limitations, or warnings';
COMMENT ON COLUMN public.protocols.citations IS 'Array of scientific paper citations supporting this protocol';
COMMENT ON COLUMN public.protocols.is_active IS 'Whether protocol is currently available to users';
