-- Mission 009 seed data for modules, protocols, and module_protocol_map

insert into public.modules (id, name, headline, description, icon_svg, tier, outcome_metric, starter_protocols)
values
    ('mod_sleep', 'Sleep Optimization', 'Sleep better, recover faster', 'Restore circadian alignment and improve sleep quality with light, temperature, and recovery rituals.', 'moon-stars', 'core', 'Sleep Quality Score', array['proto_morning_light', 'proto_evening_light', 'proto_nsdr_session']),
    ('mod_morning_routine', 'Morning Routine', 'Start your day right', 'Build a reliable morning anchor that primes energy, hydration, and movement within the first hour of wake.', 'sunrise', 'core', 'Routine Completion %', array['proto_morning_light', 'proto_hydration_electrolytes', 'proto_morning_movement']),
    ('mod_focus_productivity', 'Focus & Productivity', 'Deep work, minimal distractions', 'Protect deep work capacity, minimize distractions, and schedule recovery blocks for consistent output.', 'target', 'core', 'Focus Blocks/day', array['proto_caffeine_timing', 'proto_breathwork_hrv', 'proto_focus_information_diet']),
    ('mod_stress_regulation', 'Stress & Emotional Regulation', 'Calm mind, strong body', 'Reduce acute anxiety, strengthen parasympathetic tone, and cultivate emotional resilience.', 'lotus', 'pro', 'HRV Trend', array['proto_nsdr_session', 'proto_breathwork_hrv', 'proto_gratitude_practice']),
    ('mod_energy_recovery', 'Energy & Recovery', 'Sustained energy, rapid recovery', 'Stabilize daytime energy, accelerate recovery, and build metabolic resilience with hormetic stressors.', 'bolt', 'pro', 'Readiness Score', array['proto_cold_exposure', 'proto_movement_snacks', 'proto_hydration_electrolytes']),
    ('mod_dopamine_hygiene', 'Dopamine Hygiene', 'Restore your attention span', 'Reduce compulsive scrolling, rebalance reward sensitivity, and protect attention through stimulus management.', 'brain-circuit', 'pro', 'Screen Time', array['proto_evening_light', 'proto_focus_information_diet', 'proto_dopamine_optimization'])
on conflict (id) do update set
    name = excluded.name,
    headline = excluded.headline,
    description = excluded.description,
    icon_svg = excluded.icon_svg,
    tier = excluded.tier,
    outcome_metric = excluded.outcome_metric,
    starter_protocols = excluded.starter_protocols,
    updated_at = timezone('utc', now());

insert into public.protocols (id, name, short_name, category, summary, evidence_level)
values
    ('proto_morning_light', 'Morning Light Exposure', 'Morning Light', 'Foundation', 'Morning light (10-30 min, ≥1,000 lux, within 60 min of waking) advances sleep phase by 0.5-2.7 hours, improves sleep efficiency 10-15%, and amplifies cortisol awakening response by >50% for alertness and mood. Evidence: High (50+ peer-reviewed sources).', 'High'),
    ('proto_evening_light', 'Evening Light Management', 'Evening Light', 'Foundation', 'Evening light management (dim lights <50 lux, blue light minimization 2-3 hours pre-sleep) preserves melatonin secretion and optimizes sleep onset. Bright light (>500 lux) delays circadian phase 1-3 hours and suppresses melatonin 55-71%. Evidence: High (30+ sources).', 'High'),
    ('proto_sleep_optimization', 'Sleep Optimization', 'Sleep Optimization', 'Foundation', 'Temperature control (60-67°F), pre-sleep warm baths 90 min before bed, meal and alcohol cutoffs, and bedtime consistency ±30 min work synergistically to improve sleep onset, duration, and efficiency. Evidence: High (50+ sources).', 'High'),
    ('proto_hydration_electrolytes', 'Hydration & Electrolytes', 'Hydration', 'Foundation', 'Even mild dehydration (1-2% body mass) impairs mood and executive function via reduced cerebral blood flow. Morning hydration (16-32 oz + electrolytes within 30 min of waking) optimizes cortisol awakening response and cognitive readiness. Evidence: High (80+ sources).', 'High'),
    ('proto_caffeine_timing', 'Caffeine Timing & Cutoff', 'Caffeine Timing', 'Performance', 'Cutting off caffeine 8-10 hours before bedtime preserves sleep architecture while delaying the first dose 90-120 minutes post-wake may reduce afternoon crashes. Half-life 4-6 hours, quarter-life 8-12 hours. Evidence: High (50+ sources).', 'High'),
    ('proto_morning_movement', 'Morning Movement for Cortisol & Alertness', 'Morning Movement', 'Performance', 'Light-to-moderate Zone 2 movement within 30-90 minutes of waking boosts cortisol awakening response 50-75%, elevates catecholamines, and reinforces circadian entrainment with just 10-30 minutes daily. Evidence: High (30+ sources).', 'High'),
    ('proto_movement_snacks', 'Walking Breaks & Micro-Movement', 'Movement Snacks', 'Performance', 'Taking 2-5 minute light-intensity walks every 20-30 minutes reduces postprandial glucose 17-58%, preserves cerebral blood flow, and sustains cognitive function via improved prefrontal oxygenation. Evidence: High (75+ sources).', 'High'),
    ('proto_nutrition_cognitive', 'Nutrition for Cognitive Stability', 'Nutrition Stability', 'Performance', 'Protein distribution (0.8-1.2 g/kg), low-glycemic carbohydrates, circadian-aligned meal timing, and ultra-processed food reduction synergistically stabilize cognition and neurotransmitter supply. Evidence: High (100+ sources).', 'High'),
    ('proto_fitness_focus', 'Fitness for Focus', 'Fitness for Focus', 'Performance', 'Zone 2 aerobic exercise 3-5×/week (30-60 min) and resistance training 2-3×/week upregulate BDNF, expand hippocampal volume, and improve executive function (working memory SMD = -1.05). Evidence: Very High (70+ sources).', 'Very High'),
    ('proto_nsdr_session', 'NSDR (Non-Sleep Deep Rest) & Meditation', 'NSDR Session', 'Recovery', 'NSDR practices (Yoga Nidra, body scan, hypnosis) induce theta-dominant states, increase striatal dopamine 65%, enhance HRV, and improve sleep quality; meditation reduces cortisol 20-25% and sustains attention with 10+ min daily. Evidence: High (40+ sources).', 'High'),
    ('proto_breathwork_hrv', 'Breathwork & HRV Regulation', 'Breathwork', 'Recovery', 'Controlled breathing patterns (cyclic sighing, box breathing) rebalance autonomic tone within 5 minutes, reducing state anxiety 15-22% and increasing HRV markers of parasympathetic activity, outperforming mindfulness for acute stress relief.', 'High'),
    ('proto_cold_exposure', 'Cold Exposure & Contrast Therapy', 'Cold Exposure', 'Recovery', 'Deliberate cold exposure totaling 11 minutes/week elevates norepinephrine 250-530% and dopamine 250%, improves mood, resilience, and recovery; contrast therapy alternates hot-cold to reduce soreness 20-30% and enhance vascular adaptation.', 'High'),
    ('proto_supplement_stack', 'Foundational Supplement Stack', 'Supplement Stack', 'Optimization', 'Addressing vitamin D, omega-3, magnesium, creatine, and broad-spectrum micronutrients corrects common deficiencies, improves sleep, mood, cognition, and immune resilience while simplifying compliance with a daily stack.', 'High'),
    ('proto_dopamine_optimization', 'Dopamine Optimization', 'Dopamine Optimization', 'Optimization', 'Managing reward frequency, pairing morning sunlight with cold exposure, and practicing delayed gratification restore dopamine baseline and receptor sensitivity, improving motivation, focus, and subjective well-being.', 'High'),
    ('proto_alcohol_sleep', 'Alcohol & Sleep Quality', 'Alcohol Cutoff', 'Optimization', 'Alcohol within 3-4 hours of bed suppresses REM 15-30%, lowers HRV recovery 24-39%, and fragments second-half sleep; strict timing buffers maintain sleep quality, especially for women and adults 40+. Evidence: High (30+ studies).', 'High'),
    ('proto_focus_information_diet', 'Focus & Information Diet', 'Deep Work & Info Diet', 'Optimization', 'Structured deep work blocks (90-120 min), notification batching, and environmental phone separation reduce context-switching 40%, improve sustained attention 25-35%, and counter digital distraction effects on cognition.', 'High'),
    ('proto_cognitive_reflection', 'Cognitive Testing & Reflection Loop', 'Cognitive Reflection', 'Meta', 'Weekly mood and cognition check-ins with validated tools plus structured reflection increase self-monitoring adherence 15-40% and enable data-driven protocol adjustments without obsessive tracking.', 'Moderate-High'),
    ('proto_gratitude_practice', 'Social Connection & Accountability', 'Gratitude Practice', 'Meta', 'Supportive accountability, team challenges, and social belonging increase habit adherence 59-65%, reduce depression 47%, and spread positive behaviors across networks, reinforcing emotional resilience.', 'High')
on conflict (id) do update set
    name = excluded.name,
    short_name = excluded.short_name,
    category = excluded.category,
    summary = excluded.summary,
    evidence_level = excluded.evidence_level,
    updated_at = timezone('utc', now());

insert into public.module_protocol_map (module_id, protocol_id, is_starter_protocol, tier_required)
values
    ('mod_sleep', 'proto_morning_light', true, 'core'),
    ('mod_sleep', 'proto_evening_light', true, 'core'),
    ('mod_sleep', 'proto_nsdr_session', true, 'core'),
    ('mod_sleep', 'proto_caffeine_timing', false, 'core'),
    ('mod_sleep', 'proto_sleep_optimization', false, 'core'),
    ('mod_morning_routine', 'proto_morning_light', true, 'core'),
    ('mod_morning_routine', 'proto_hydration_electrolytes', true, 'core'),
    ('mod_morning_routine', 'proto_morning_movement', true, 'core'),
    ('mod_morning_routine', 'proto_cold_exposure', false, 'core'),
    ('mod_morning_routine', 'proto_gratitude_practice', false, 'core'),
    ('mod_focus_productivity', 'proto_caffeine_timing', true, 'core'),
    ('mod_focus_productivity', 'proto_breathwork_hrv', true, 'core'),
    ('mod_focus_productivity', 'proto_focus_information_diet', true, 'core'),
    ('mod_focus_productivity', 'proto_movement_snacks', false, 'core'),
    ('mod_focus_productivity', 'proto_nsdr_session', false, 'core'),
    ('mod_stress_regulation', 'proto_nsdr_session', true, 'pro'),
    ('mod_stress_regulation', 'proto_breathwork_hrv', true, 'pro'),
    ('mod_stress_regulation', 'proto_gratitude_practice', true, 'pro'),
    ('mod_stress_regulation', 'proto_evening_light', false, 'pro'),
    ('mod_stress_regulation', 'proto_cold_exposure', false, 'pro'),
    ('mod_energy_recovery', 'proto_cold_exposure', true, 'pro'),
    ('mod_energy_recovery', 'proto_movement_snacks', true, 'pro'),
    ('mod_energy_recovery', 'proto_hydration_electrolytes', true, 'pro'),
    ('mod_energy_recovery', 'proto_morning_light', false, 'pro'),
    ('mod_energy_recovery', 'proto_nsdr_session', false, 'pro'),
    ('mod_dopamine_hygiene', 'proto_evening_light', true, 'pro'),
    ('mod_dopamine_hygiene', 'proto_focus_information_diet', true, 'pro'),
    ('mod_dopamine_hygiene', 'proto_dopamine_optimization', true, 'pro'),
    ('mod_dopamine_hygiene', 'proto_cold_exposure', false, 'pro'),
    ('mod_dopamine_hygiene', 'proto_morning_light', false, 'pro')
on conflict (module_id, protocol_id) do update set
    is_starter_protocol = excluded.is_starter_protocol,
    tier_required = excluded.tier_required,
    updated_at = timezone('utc', now());
