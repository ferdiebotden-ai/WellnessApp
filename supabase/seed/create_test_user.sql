-- Create Test User for MVP Testing
-- This script creates a test user with proper enrollment and trial dates
--
-- PREREQUISITES:
-- 1. User must already exist in Firebase Auth
-- 2. Modules must be seeded (run mission_009_modules_protocols.sql first)
-- 3. Update the 'id' field below with the actual Firebase UID
--
-- USAGE:
-- Replace 'FIREBASE_UID_HERE' with the actual UID from Firebase Auth
-- Then run this script in Supabase SQL Editor

-- ============================================================================
-- CONFIGURATION - UPDATE THESE VALUES
-- ============================================================================

-- Replace this with the actual Firebase UID (get from Firebase Console > Authentication)
\set test_user_id 'test-user-firebase-uid-replace-me'

-- Test user email (should match Firebase Auth email)
\set test_user_email 'test@wellnessos.app'

-- ============================================================================
-- 1. CREATE USER PROFILE
-- ============================================================================

insert into public.users (
    id,
    email,
    display_name,
    tier,
    trial_start_date,
    trial_end_date,
    onboarding_complete,
    preferences,
    healthMetrics,
    earnedBadges,
    subscription_id
)
values (
    :'test_user_id',
    :'test_user_email',
    'Test User',
    'trial', -- trial | core | pro | elite | lapsed
    timezone('utc', now()), -- Trial starts now
    timezone('utc', now()) + interval '14 days', -- Trial ends in 14 days
    true, -- Onboarding marked as complete
    jsonb_build_object(
        'primary_module_id', 'mod_sleep',
        'nudge_tone', 'motivational',
        'quiet_hours_enabled', true,
        'quiet_start_time', '22:00',
        'quiet_end_time', '08:00',
        'social_anonymous', false
    ),
    jsonb_build_object(
        'sleepQualityTrend', 7.2,
        'hrvImprovementPct', 0,
        'protocolAdherencePct', 0,
        'moduleProgressPct', jsonb_build_object()
    ),
    array[]::text[], -- No badges earned yet
    null -- No subscription yet (trial)
)
on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    tier = excluded.tier,
    trial_start_date = excluded.trial_start_date,
    trial_end_date = excluded.trial_end_date,
    onboarding_complete = excluded.onboarding_complete,
    preferences = excluded.preferences,
    healthMetrics = excluded.healthMetrics,
    earnedBadges = excluded.earnedBadges,
    subscription_id = excluded.subscription_id;

-- ============================================================================
-- 2. ENROLL IN PRIMARY MODULE (Sleep Optimization)
-- ============================================================================

insert into public.module_enrollment (
    user_id,
    module_id,
    is_primary,
    enrolled_at,
    currentStreak,
    longestStreak,
    lastActiveDate,
    progressPct,
    streakFreezeAvailable,
    streakFreezeUsedDate
)
values (
    :'test_user_id',
    'mod_sleep', -- Primary module: Sleep Optimization (core tier)
    true, -- This is the primary module
    timezone('utc', now()),
    0, -- No streak yet
    0,
    timezone('utc', now()),
    0.0, -- 0% progress
    true, -- Streak freeze available
    null
)
on conflict (user_id, module_id) do update set
    is_primary = excluded.is_primary,
    enrolled_at = excluded.enrolled_at;

-- ============================================================================
-- 3. ENROLL IN SECONDARY MODULE (Focus & Productivity)
-- ============================================================================

insert into public.module_enrollment (
    user_id,
    module_id,
    is_primary,
    enrolled_at,
    currentStreak,
    longestStreak,
    lastActiveDate,
    progressPct,
    streakFreezeAvailable,
    streakFreezeUsedDate
)
values (
    :'test_user_id',
    'mod_focus_productivity', -- Secondary module: Focus & Productivity (core tier)
    false, -- Not primary
    timezone('utc', now()),
    0,
    0,
    timezone('utc', now()),
    0.0,
    true,
    null
)
on conflict (user_id, module_id) do nothing;

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Verify user was created
select
    id,
    email,
    display_name,
    tier,
    trial_start_date,
    trial_end_date,
    onboarding_complete,
    preferences->>'primary_module_id' as primary_module
from public.users
where id = :'test_user_id';

-- Verify module enrollments
select
    me.user_id,
    me.module_id,
    m.name as module_name,
    me.is_primary,
    me.currentStreak,
    me.progressPct
from public.module_enrollment me
join public.modules m on m.id = me.module_id
where me.user_id = :'test_user_id'
order by me.is_primary desc, m.name;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- Row 1: User profile with test@wellnessos.app, tier='trial', 14-day trial
-- Row 2: Enrollment in 'mod_sleep' (is_primary=true)
-- Row 3: Enrollment in 'mod_focus_productivity' (is_primary=false)
-- ============================================================================
