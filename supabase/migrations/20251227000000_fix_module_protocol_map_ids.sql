-- Fix protocol ID mismatch between seed file (proto_*) and migration file (protocol_*)
-- The module_protocol_map table references proto_* IDs but protocols table has protocol_* IDs
-- This migration updates module_protocol_map to use the correct protocol_* IDs

-- First, delete orphaned rows that reference non-existent protocols
DELETE FROM public.module_protocol_map
WHERE protocol_id NOT IN (SELECT id FROM public.protocols);

-- Now insert the correct mappings using protocol_* IDs from the main seed

-- Sleep Optimization Module
INSERT INTO public.module_protocol_map (module_id, protocol_id, is_starter_protocol, tier_required)
VALUES
    ('mod_sleep', 'protocol_1_morning_light', true, 'core'),
    ('mod_sleep', 'protocol_2_evening_light', true, 'core'),
    ('mod_sleep', 'protocol_10_nsdr', true, 'core'),
    ('mod_sleep', 'protocol_5_caffeine_timing', false, 'core'),
    ('mod_sleep', 'protocol_3_sleep_optimization', false, 'core')
ON CONFLICT (module_id, protocol_id) DO UPDATE SET
    is_starter_protocol = EXCLUDED.is_starter_protocol,
    tier_required = EXCLUDED.tier_required,
    updated_at = timezone('utc', now());

-- Morning Routine Module
INSERT INTO public.module_protocol_map (module_id, protocol_id, is_starter_protocol, tier_required)
VALUES
    ('mod_morning_routine', 'protocol_1_morning_light', true, 'core'),
    ('mod_morning_routine', 'protocol_4_hydration', true, 'core'),
    ('mod_morning_routine', 'protocol_6_morning_movement', true, 'core'),
    ('mod_morning_routine', 'protocol_12_cold_exposure', false, 'core'),
    ('mod_morning_routine', 'protocol_18_social_accountability', false, 'core')
ON CONFLICT (module_id, protocol_id) DO UPDATE SET
    is_starter_protocol = EXCLUDED.is_starter_protocol,
    tier_required = EXCLUDED.tier_required,
    updated_at = timezone('utc', now());

-- Focus & Productivity Module
INSERT INTO public.module_protocol_map (module_id, protocol_id, is_starter_protocol, tier_required)
VALUES
    ('mod_focus_productivity', 'protocol_5_caffeine_timing', true, 'core'),
    ('mod_focus_productivity', 'protocol_11_breathwork', true, 'core'),
    ('mod_focus_productivity', 'protocol_16_focus', true, 'core'),
    ('mod_focus_productivity', 'protocol_7_walking_breaks', false, 'core'),
    ('mod_focus_productivity', 'protocol_10_nsdr', false, 'core')
ON CONFLICT (module_id, protocol_id) DO UPDATE SET
    is_starter_protocol = EXCLUDED.is_starter_protocol,
    tier_required = EXCLUDED.tier_required,
    updated_at = timezone('utc', now());

-- Stress & Emotional Regulation Module
INSERT INTO public.module_protocol_map (module_id, protocol_id, is_starter_protocol, tier_required)
VALUES
    ('mod_stress_regulation', 'protocol_10_nsdr', true, 'pro'),
    ('mod_stress_regulation', 'protocol_11_breathwork', true, 'pro'),
    ('mod_stress_regulation', 'protocol_18_social_accountability', true, 'pro'),
    ('mod_stress_regulation', 'protocol_2_evening_light', false, 'pro'),
    ('mod_stress_regulation', 'protocol_12_cold_exposure', false, 'pro')
ON CONFLICT (module_id, protocol_id) DO UPDATE SET
    is_starter_protocol = EXCLUDED.is_starter_protocol,
    tier_required = EXCLUDED.tier_required,
    updated_at = timezone('utc', now());

-- Energy & Recovery Module
INSERT INTO public.module_protocol_map (module_id, protocol_id, is_starter_protocol, tier_required)
VALUES
    ('mod_energy_recovery', 'protocol_12_cold_exposure', true, 'pro'),
    ('mod_energy_recovery', 'protocol_7_walking_breaks', true, 'pro'),
    ('mod_energy_recovery', 'protocol_4_hydration', true, 'pro'),
    ('mod_energy_recovery', 'protocol_1_morning_light', false, 'pro'),
    ('mod_energy_recovery', 'protocol_10_nsdr', false, 'pro')
ON CONFLICT (module_id, protocol_id) DO UPDATE SET
    is_starter_protocol = EXCLUDED.is_starter_protocol,
    tier_required = EXCLUDED.tier_required,
    updated_at = timezone('utc', now());

-- Dopamine Hygiene Module
INSERT INTO public.module_protocol_map (module_id, protocol_id, is_starter_protocol, tier_required)
VALUES
    ('mod_dopamine_hygiene', 'protocol_2_evening_light', true, 'pro'),
    ('mod_dopamine_hygiene', 'protocol_16_focus', true, 'pro'),
    ('mod_dopamine_hygiene', 'protocol_14_dopamine', true, 'pro'),
    ('mod_dopamine_hygiene', 'protocol_12_cold_exposure', false, 'pro'),
    ('mod_dopamine_hygiene', 'protocol_1_morning_light', false, 'pro')
ON CONFLICT (module_id, protocol_id) DO UPDATE SET
    is_starter_protocol = EXCLUDED.is_starter_protocol,
    tier_required = EXCLUDED.tier_required,
    updated_at = timezone('utc', now());

-- Also update the starter_protocols array in modules table to use correct IDs
UPDATE public.modules
SET starter_protocols = ARRAY['protocol_1_morning_light', 'protocol_2_evening_light', 'protocol_10_nsdr']
WHERE id = 'mod_sleep';

UPDATE public.modules
SET starter_protocols = ARRAY['protocol_1_morning_light', 'protocol_4_hydration', 'protocol_6_morning_movement']
WHERE id = 'mod_morning_routine';

UPDATE public.modules
SET starter_protocols = ARRAY['protocol_5_caffeine_timing', 'protocol_11_breathwork', 'protocol_16_focus']
WHERE id = 'mod_focus_productivity';

UPDATE public.modules
SET starter_protocols = ARRAY['protocol_10_nsdr', 'protocol_11_breathwork', 'protocol_18_social_accountability']
WHERE id = 'mod_stress_regulation';

UPDATE public.modules
SET starter_protocols = ARRAY['protocol_12_cold_exposure', 'protocol_7_walking_breaks', 'protocol_4_hydration']
WHERE id = 'mod_energy_recovery';

UPDATE public.modules
SET starter_protocols = ARRAY['protocol_2_evening_light', 'protocol_16_focus', 'protocol_14_dopamine']
WHERE id = 'mod_dopamine_hygiene';
