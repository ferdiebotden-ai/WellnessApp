-- Migration: Add step_goal column to users table
-- Purpose: Allow users to configure their daily step goal for the Health Dashboard
-- Author: Claude Opus 4.5 (Session 85)
-- Date: December 26, 2025

-- Add step_goal column with default of 10,000 steps
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS step_goal INTEGER DEFAULT 10000
CHECK (step_goal BETWEEN 1000 AND 50000);

-- Add comment
COMMENT ON COLUMN public.users.step_goal IS 'Daily step goal for Health Dashboard (default: 10,000)';
