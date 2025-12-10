-- Protocol Seeding
-- Seeds 18 protocols with enriched data from Master_Protocol_Library.md
-- Session 59: Protocol Data Enrichment & Personalization

-- Foundation Protocol 1: Morning Light Exposure
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_1_morning_light',
  'Morning Light Exposure',
  'Morning Light',
  'Foundation',
  'Morning light (10-30 min, ≥1,000 lux, within 60 min of waking) advances sleep phase by 0.5-2.7 hours and improves sleep efficiency by 10-15% within 1-2 weeks.',
  'Very High',
  'Get 10-30 minutes of outdoor light exposure within the first hour of waking. This is the single highest-impact protocol for circadian optimization. Even cloudy outdoor light (1,000-5,000 lux) is 10-100x brighter than indoor lighting.',
  'core',
  'Sleep phase advance (0.5-2.7 hours), sleep efficiency improvement (10-15%), cortisol awakening response amplification (>50%), mood enhancement via dopamine/serotonin pathways, reduced morning grogginess.',
  'Requires outdoor access or 10,000 lux light therapy lamp. Indoor ambient lighting (<500 lux) is insufficient. Effectiveness depends on consistency (6-7 days/week). Sunglasses block the benefit.',
  'Melanopsin-containing retinal ganglion cells (ipRGCs) detect blue light (~480nm) and signal directly to the suprachiasmatic nucleus (SCN) via the retinohypothalamic tract. This resets your master circadian clock, triggering cortisol release and suppressing melatonin. The SCN then synchronizes peripheral clocks throughout your body, aligning sleep-wake cycles with the solar day.',
  15, 7,
  '{"intensity": {"min": 1000, "optimal": 5000, "max": 10000, "unit": "lux"}, "timing": {"min": 0, "optimal": 30, "max": 60, "unit": "minutes_post_wake"}, "duration": {"min": 10, "optimal": 15, "max": 30, "unit": "minutes"}}',
  '{"if_sunny_outdoor": "Perfect! Sunny outdoor light is optimal. Just 10 minutes needed.", "if_cloudy_outdoor": "Even cloudy outdoor light works great. Aim for 15 minutes.", "if_indoor_window": "Window light is okay, but try to step outside for even 5 min if possible.", "if_indoor_ambient": "Indoor light is too dim. Consider a 10,000 lux light therapy lamp, or step outside."}',
  '[{"metric": "Sleep efficiency", "baseline": "75%", "target": "85%+", "timeline": "2-4 weeks"}, {"metric": "Sleep onset latency", "baseline": "45 min", "target": "15-20 min", "timeline": "1-2 weeks"}, {"metric": "Wake time consistency", "baseline": "±60 min", "target": "±30 min", "timeline": "2 weeks"}]',
  ARRAY['https://doi.org/10.1016/j.cub.2013.06.039', 'https://doi.org/10.1001/archpsyc.58.1.69', 'https://doi.org/10.1210/jcem.86.1.7102', 'https://doi.org/10.1016/j.smrv.2014.11.004'],
  '[{"author": "Wright KP et al.", "year": 2013, "title": "Entrainment of the human circadian clock to the natural light-dark cycle", "journal": "Current Biology", "doi": "10.1016/j.cub.2013.06.039"}, {"author": "Terman M et al.", "year": 2001, "title": "Circadian time of morning light administration and therapeutic response in winter depression", "journal": "Archives of General Psychiatry", "doi": "10.1001/archpsyc.58.1.69"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Foundation Protocol 2: Evening Light Management
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_2_evening_light',
  'Evening Light Management',
  'Evening Light',
  'Foundation',
  'Dim lights <50 lux and minimize blue light 2-3 hours before sleep to preserve melatonin secretion and optimize sleep onset. Bright evening light delays circadian phase by 1-3 hours.',
  'High',
  'Starting 2-3 hours before your target bedtime, dim overhead lights to <50 lux (candlelight level) and use blue light filters on all screens. In the final hour before sleep, eliminate screens entirely if possible.',
  'core',
  'Preserved melatonin onset, faster sleep onset (10-15 min improvement), stable circadian phase, reduced sleep onset latency, improved REM sleep duration.',
  'Requires behavioral change in evening routine. May conflict with work demands or social activities. Blue light filters reduce but don''t eliminate screen impact.',
  'Evening light exposure suppresses melatonin synthesis in the pineal gland by up to 55-71%. Light detected by ipRGCs signals "daytime" to the SCN, which inhibits melatonin release. This delays your dim-light melatonin onset (DLMO) and shifts your circadian phase later, making it harder to fall asleep at your desired time.',
  120, 7,
  '{"ambient_light": {"min": 0, "optimal": 10, "max": 50, "unit": "lux"}, "timing_before_bed": {"min": 2, "optimal": 3, "max": 4, "unit": "hours"}}',
  '{"if_2h_before_bed": "Start dimming lights and enable blue light filters on all devices.", "if_1h_before_bed": "Time to dim lights to candlelight level and put away screens.", "if_screens_needed": "Use amber-tinted blue light blocking glasses (filter >90% blue light)."}',
  '[{"metric": "Sleep onset latency", "baseline": "30+ min", "target": "<15 min", "timeline": "1-2 weeks"}, {"metric": "Subjective sleepiness onset", "baseline": "Variable", "target": "Consistent 30 min pre-bed", "timeline": "1 week"}]',
  ARRAY['https://doi.org/10.1073/pnas.1418490112', 'https://doi.org/10.1210/jc.2010-2098', 'https://doi.org/10.1093/sleep/zsaa194'],
  '[{"author": "Chang AM et al.", "year": 2015, "title": "Evening use of light-emitting eReaders negatively affects sleep", "journal": "PNAS", "doi": "10.1073/pnas.1418490112"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Foundation Protocol 3: Sleep Optimization
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_3_sleep_optimization',
  'Sleep Optimization',
  'Sleep',
  'Foundation',
  'Optimize sleep through temperature control (60-67°F), pre-sleep warm baths 90 min before bedtime, meal cutoffs 3h prior, and bedtime consistency ±30 min.',
  'Very High',
  'A multi-factor approach to sleep quality: bedroom temperature 65°F (60-67°F range), warm bath 90 minutes before sleep, finish eating 3 hours before bed, stop alcohol 4+ hours before bed, and maintain consistent bedtime ±30 minutes.',
  'core',
  'Improved sleep architecture, faster sleep onset, better sleep efficiency, enhanced deep sleep duration, reduced night awakenings, improved next-day energy and cognition.',
  'Requires lifestyle adjustments. Late dinners and evening alcohol are common challenges. Temperature control may require A/C or fan investment.',
  'Sleep onset requires a 1-2°F drop in core body temperature. Cool room temperature (60-67°F) facilitates heat dissipation. A warm bath 90 min before bed causes vasodilation and heat loss, accelerating the natural temperature decline. Late meals prevent temperature drop and suppress melatonin. Alcohol suppresses REM sleep and causes fragmentation in the second half of the night.',
  480, 7,
  '{"bedroom_temp": {"min": 60, "optimal": 65, "max": 67, "unit": "fahrenheit"}, "bath_timing": {"min": 60, "optimal": 90, "max": 120, "unit": "minutes_before_bed"}, "meal_cutoff": {"min": 2, "optimal": 3, "max": 4, "unit": "hours_before_bed"}}',
  '{"if_room_too_warm": "Room temp above 70°F reduces sleep quality. Lower thermostat to 65°F.", "if_late_dinner": "Late eating delays melatonin. Finish eating 3 hours before bed tomorrow.", "if_alcohol_late": "Alcohol within 4 hours of bed suppresses REM. Plan earlier consumption."}',
  '[{"metric": "Sleep efficiency", "baseline": "75%", "target": ">85%", "timeline": "2-4 weeks"}, {"metric": "Deep sleep duration", "baseline": "Variable", "target": "+15-20%", "timeline": "2-4 weeks"}]',
  ARRAY['https://doi.org/10.1093/sleep/zsaa056.1208', 'https://doi.org/10.1016/j.smrv.2019.04.002', 'https://doi.org/10.1016/j.smrv.2024.101967'],
  '[{"author": "Haghayegh S et al.", "year": 2019, "title": "Before-bedtime passive body heating by warm shower or bath to improve sleep", "journal": "Sleep Medicine Reviews", "doi": "10.1016/j.smrv.2019.04.002"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Foundation Protocol 4: Hydration & Electrolytes
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_4_hydration',
  'Hydration & Electrolytes',
  'Hydration',
  'Foundation',
  'Even mild dehydration (1-2%) significantly impairs mood, concentration, and executive function. Morning hydration (16-32 oz + electrolytes within 30 min of waking) optimizes alertness.',
  'High',
  'Drink 16-32 oz of water with electrolytes (500mg sodium, 200mg potassium, 100mg magnesium) within 30 minutes of waking. Daily target: body weight in lbs ÷ 2 = ounces of water.',
  'core',
  'Enhanced alertness within 30-60 min of morning hydration, improved mood, better concentration, supported cortisol awakening response, reduced afternoon fatigue.',
  'Requires morning routine adjustment. Those with kidney disease or hypertension need modified sodium intake. Risk of overhydration if excessive water without electrolytes.',
  'Overnight, you lose approximately 1 liter of water through respiration and perspiration. Even 1-2% dehydration impairs cerebral blood flow and neurotransmitter synthesis, affecting mood, concentration, and executive function. Morning electrolytes (Na+, K+, Mg2+) support the sodium-potassium pump essential for neural signaling and optimize the cortisol awakening response.',
  5, 7,
  '{"morning_volume": {"min": 500, "optimal": 750, "max": 1000, "unit": "mL"}, "sodium": {"min": 500, "optimal": 750, "max": 1000, "unit": "mg"}}',
  '{"on_wake": "Drink 16-32 oz water + electrolytes within 30 min of waking.", "during_day": "Track hydration—aim for body weight (lbs) ÷ 2 = daily oz."}',
  '[{"metric": "Morning alertness", "baseline": "Groggy", "target": "Alert within 30 min", "timeline": "3-7 days"}, {"metric": "Urine color", "baseline": "Dark yellow", "target": "Pale yellow (2-4)", "timeline": "3-7 days"}]',
  ARRAY['https://doi.org/10.3945/jn.111.142000', 'https://doi.org/10.1017/S0007114513004455'],
  '[{"author": "Armstrong LE et al.", "year": 2012, "title": "Mild dehydration affects mood in healthy young women", "journal": "The Journal of Nutrition", "doi": "10.3945/jn.111.142000"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Performance Protocol 5: Caffeine Timing
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_5_caffeine_timing',
  'Caffeine Timing & Cutoff',
  'Caffeine',
  'Performance',
  'Caffeine cutoff 8-10 hours before bedtime preserves sleep onset, architecture, and quality. 400mg doses show significant disruption even 12 hours before bed.',
  'High',
  'Stop caffeine consumption 8-10 hours before your target bedtime (10 hours for poor sleepers or sensitive individuals). Daily limit: 400mg for healthy adults. Optional: delay first caffeine 90-120 min post-wake.',
  'core',
  'Faster sleep onset, preserved deep sleep duration, better sleep efficiency, reduced night awakenings, more consistent morning alertness.',
  'May require adjustment for those dependent on afternoon caffeine. Half-life varies by genetics (CYP1A2). Pregnant women should limit to 200mg/day.',
  'Caffeine is a competitive antagonist at adenosine receptors. Adenosine accumulates during wakefulness and creates "sleep pressure." Caffeine blocks this signal without clearing adenosine—so when caffeine wears off (half-life 4-6 hours), the accumulated adenosine floods receptors, causing the "crash." Late caffeine prevents the natural adenosine signal that promotes sleep onset.',
  0, 7,
  '{"cutoff_hours": {"min": 8, "optimal": 10, "max": 12, "unit": "hours_before_bed"}, "daily_limit": {"min": 0, "optimal": 200, "max": 400, "unit": "mg"}}',
  '{"if_poor_sleeper": "Extend cutoff to 10 hours before bedtime.", "if_afternoon_crash": "Try delaying first caffeine 90-120 min after waking.", "at_cutoff_time": "Last call for caffeine. Cut off now = better sleep tonight."}',
  '[{"metric": "Sleep onset latency", "baseline": "30+ min", "target": "<15 min", "timeline": "3-7 days"}, {"metric": "Total sleep time", "baseline": "-45 min deficit", "target": "Full 7-8h", "timeline": "1 week"}]',
  ARRAY['https://doi.org/10.5664/jcsm.3170', 'https://doi.org/10.1093/sleep/zsae230', 'https://doi.org/10.1126/scitranslmed.aac5125'],
  '[{"author": "Drake C et al.", "year": 2013, "title": "Caffeine effects on sleep taken 0, 3, or 6 hours before bed", "journal": "Journal of Clinical Sleep Medicine", "doi": "10.5664/jcsm.3170"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Performance Protocol 6: Morning Movement
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_6_morning_movement',
  'Morning Movement',
  'AM Movement',
  'Performance',
  'Light-to-moderate aerobic exercise (Zone 2, 50-70% max HR) within 30-90 min of waking enhances cortisol awakening response by 50-75% and releases catecholamines.',
  'High',
  '10-30 minutes of Zone 2 exercise (conversational pace) within 30-90 minutes of waking. Outdoor walking combines this with morning light exposure for maximum benefit.',
  'core',
  'Amplified cortisol awakening response (+50-75%), increased dopamine and norepinephrine, enhanced alertness for 6-8 hours, reinforced circadian entrainment.',
  'Requires time in morning routine. May need to wake earlier. Weather-dependent for outdoor options. HRV-aware—skip if HRV is significantly below baseline.',
  'Morning exercise activates the sympathetic nervous system and HPA axis, amplifying the natural cortisol awakening response by 50-75%. The resulting catecholamine release (dopamine, norepinephrine) provides sustained alertness. Combined with outdoor light, this creates a powerful circadian anchor that reinforces wake-time consistency.',
  20, 5,
  '{"timing_post_wake": {"min": 30, "optimal": 45, "max": 90, "unit": "minutes"}, "duration": {"min": 10, "optimal": 20, "max": 30, "unit": "minutes"}, "intensity": {"min": 50, "optimal": 65, "max": 70, "unit": "percent_max_hr"}}',
  '{"on_wake": "Time for morning movement! 10-30 min Zone 2 amplifies your cortisol awakening response.", "if_low_hrv": "HRV is low today—keep movement to light walking only."}',
  '[{"metric": "Morning alertness", "baseline": "Groggy 1-2h", "target": "Alert within 30 min", "timeline": "1-2 weeks"}, {"metric": "Energy through day", "baseline": "Variable", "target": "+1-2 points", "timeline": "1-2 weeks"}]',
  ARRAY['https://doi.org/10.1007/s00421-019-04136-9', 'https://doi.org/10.1038/s41598-025-02659-8'],
  '[{"author": "Drogos LL et al.", "year": 2019, "title": "Aerobic exercise increases cortisol awakening response in older adults", "journal": "European Journal of Applied Physiology", "doi": "10.1007/s00421-019-04136-9"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Performance Protocol 7: Walking Breaks
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_7_walking_breaks',
  'Walking Breaks & Micro-Movement',
  'Walking Breaks',
  'Performance',
  '2-5 min light walking every 20-30 min during sedentary work reduces postprandial glucose by 17-58%, preserves cerebral blood flow, and improves cognitive function.',
  'Very High',
  'Take 2-5 minute walking breaks every 20-30 minutes during sedentary work. Priority: walk within 10-15 minutes after meals to blunt glucose spikes by 30-50%.',
  'core',
  'Reduced glucose spikes (17-58%), preserved cerebral blood flow, improved prefrontal cortex oxygenation, sustained attention, reduced afternoon energy crashes.',
  'May conflict with meeting schedules or focused work. Requires awareness and discipline. Can use standing or seated micro-movements as alternatives.',
  'Prolonged sitting reduces middle cerebral artery velocity by 3.2 cm/s, impairing cognitive function. Walking activates muscle GLUT4 transporters, enabling insulin-independent glucose uptake that blunts post-meal spikes. Brief movement restores cerebral blood flow and prefrontal cortex oxygenation, maintaining attention and executive function.',
  3, 7,
  '{"break_interval": {"min": 15, "optimal": 20, "max": 30, "unit": "minutes"}, "break_duration": {"min": 2, "optimal": 3, "max": 5, "unit": "minutes"}}',
  '{"after_30min_sitting": "Time for a 2-5 min walking break! This prevents glucose spikes and keeps your brain sharp.", "post_meal": "Perfect timing for a 3-5 min walk! Post-meal movement prevents glucose spikes by 30-50%."}',
  '[{"metric": "Postprandial glucose spike", "baseline": "High", "target": "-30 to -50%", "timeline": "Same day"}, {"metric": "Afternoon energy crashes", "baseline": "5-7x/week", "target": "0-2x/week", "timeline": "2-3 weeks"}]',
  ARRAY['https://doi.org/10.2337/dc11-1931', 'https://doi.org/10.1152/japplphysiol.00310.2018'],
  '[{"author": "Dunstan DW et al.", "year": 2012, "title": "Breaking up prolonged sitting reduces postprandial glucose and insulin responses", "journal": "Diabetes Care", "doi": "10.2337/dc11-1931"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Performance Protocol 8: Nutrition
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_8_nutrition',
  'Nutrition for Cognitive Stability',
  'Brain Nutrition',
  'Performance',
  'Protein-driven neurotransmitter synthesis (0.8-1.2 g/kg), low-glycemic carbs (GI <55), 8-10h eating window, and UPF <10-15% synergistically support cognitive stability.',
  'High',
  'Consume 0.8-1.2 g/kg body weight of protein distributed across meals (emphasize ≥20g at dinner). Choose low-GI carbohydrates. Finish eating 2-3 hours before sleep. Limit ultra-processed foods to <10-15% of daily calories.',
  'core',
  'Stable blood glucose, sustained focus, reduced afternoon crashes, improved neurotransmitter synthesis (dopamine, serotonin), better sleep quality, reduced cognitive decline risk.',
  'Requires meal planning and awareness. May conflict with social eating patterns. Not appropriate for those with eating disorder history (use principles-based approach instead).',
  'Protein provides tyrosine (dopamine precursor) and tryptophan (serotonin precursor). Low-GI carbohydrates sustain glucose delivery without reactive hypoglycemia. Time-restricted eating aligns peripheral circadian clocks. Ultra-processed foods (>20% daily calories) accelerate cognitive decline by 28% over 8 years via neuroinflammation.',
  0, 7,
  '{"protein_per_kg": {"min": 0.8, "optimal": 1.0, "max": 1.2, "unit": "g_per_kg"}, "glycemic_index": {"min": 0, "optimal": 40, "max": 55, "unit": "GI_score"}}',
  '{"if_high_gi_meal": "High-GI foods cause glucose crashes. Swap white rice → brown rice, sugary cereal → steel-cut oats.", "if_late_dinner": "Late eating delays melatonin. Finish eating 2-3h before bed tomorrow."}',
  '[{"metric": "Afternoon energy crashes", "baseline": "5-7x/week", "target": "0-2x/week", "timeline": "2-3 weeks"}, {"metric": "Focus duration", "baseline": "Variable", "target": "+20-30%", "timeline": "2-4 weeks"}]',
  ARRAY['https://doi.org/10.1017/S0954422424000271', 'https://doi.org/10.1001/jamaneurol.2022.4397'],
  '[{"author": "Gonçalves NG et al.", "year": 2023, "title": "Association between consumption of ultraprocessed foods and cognitive decline", "journal": "JAMA Neurology", "doi": "10.1001/jamaneurol.2022.4397"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Performance Protocol 9: Fitness for Focus
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_9_fitness_for_focus',
  'Fitness for Focus',
  'Fitness',
  'Performance',
  'Aerobic exercise (Zone 2, 3-5x/week × 30-60 min) is the most potent BDNF stimulus. Combined with resistance training (2-3x/week), it improves executive function by 20-30%.',
  'Very High',
  'Aim for 3-5 aerobic sessions (Zone 2, 30-60 min) plus 2-3 resistance training sessions per week. This combination produces the largest executive function and neuroplasticity gains.',
  'core',
  'BDNF upregulation (+15-30% baseline), hippocampal volume increase (+1-2%), improved working memory, better inhibitory control, enhanced synaptic plasticity, reversed age-related brain atrophy.',
  'Requires significant time investment (4-6 hours/week). Medical clearance needed for sedentary individuals >40 with cardiovascular risk factors. Must monitor HRV for recovery.',
  'Aerobic exercise is the most potent behavioral stimulus for brain-derived neurotrophic factor (BDNF), which promotes hippocampal neurogenesis and synaptic plasticity. Resistance training activates myogenic factors (irisin, IGF-1) that cross the blood-brain barrier and upregulate BDNF via independent pathways. Combined training produces 20-30% larger cognitive gains than aerobic alone.',
  45, 5,
  '{"aerobic_sessions": {"min": 2, "optimal": 4, "max": 5, "unit": "sessions_per_week"}, "resistance_sessions": {"min": 1, "optimal": 2, "max": 3, "unit": "sessions_per_week"}}',
  '{"if_beginner": "Start with 3 sessions/week: 2 aerobic (30 min) + 1 resistance (30 min).", "if_low_hrv": "HRV is low—rest day recommended. Skip vigorous exercise; light Zone 2 walk only."}',
  '[{"metric": "Working memory (n-back)", "baseline": "Baseline", "target": "+20% effect size", "timeline": "4-8 weeks"}, {"metric": "Executive function (Stroop)", "baseline": "Baseline", "target": ">10% improvement", "timeline": "4-8 weeks"}]',
  ARRAY['https://doi.org/10.1073/pnas.1015950108', 'https://doi.org/10.3389/fnins.2022.895765', 'https://doi.org/10.3233/BPL-160040'],
  '[{"author": "Erickson KI et al.", "year": 2011, "title": "Exercise training increases size of hippocampus and improves memory", "journal": "PNAS", "doi": "10.1073/pnas.1015950108"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Recovery Protocol 10: NSDR
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_10_nsdr',
  'NSDR (Non-Sleep Deep Rest)',
  'NSDR',
  'Recovery',
  '10-20 minute daily NSDR practice (Yoga Nidra, body scan, hypnosis) increases dopamine by 65%, improves HRV recovery by 8-15%, and enhances sleep quality when practiced pre-bedtime.',
  'High',
  'Practice 10-30 minutes of NSDR (Yoga Nidra, body scan, or hypnosis) daily. For dopamine boost, practice midday (1-2 PM). For sleep enhancement, practice 30-60 minutes before bedtime.',
  'core',
  'Dopamine increase (+65% striatal dopamine), HRV recovery (+8-15%), cortisol reduction (-20-25%), faster sleep onset (-8-12 min), enhanced subjective rest.',
  'Requires quiet environment. May induce drowsiness if timed incorrectly. Those with severe PTSD or psychosis should use modified approaches under supervision.',
  'NSDR shifts cortical activity from beta (alert) to theta (4-8 Hz, deep relaxation) brain waves. PET imaging shows Yoga Nidra increases striatal dopamine by 65%, comparable to rewarding stimuli but achieved through rest. This activates the parasympathetic nervous system, increases HRV, and reduces cortisol, creating a restorative state distinct from sleep.',
  20, 7,
  '{"duration": {"min": 10, "optimal": 20, "max": 30, "unit": "minutes"}, "timing_before_bed": {"min": 30, "optimal": 45, "max": 60, "unit": "minutes"}}',
  '{"if_stressed": "NSDR (Yoga Nidra) recovers faster than meditation—try midday + pre-bedtime.", "if_poor_sleep": "Practice NSDR 30-60 min before bed. Expect 12-18% sleep quality improvement by Week 3."}',
  '[{"metric": "Stress rating", "baseline": "7/10", "target": "5/10", "timeline": "1-2 weeks"}, {"metric": "HRV recovery", "baseline": "Baseline", "target": "+8-15%", "timeline": "2-3 weeks"}]',
  ARRAY['https://doi.org/10.1016/j.neuroimage.2002.04.003'],
  '[{"author": "Kjaer TW et al.", "year": 2002, "title": "Increased dopamine tone during meditation-induced change of consciousness", "journal": "Cognitive Brain Research", "doi": "10.1016/S0926-6410(02)00068-X"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Recovery Protocol 11: Breathwork
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_11_breathwork',
  'Breathwork & HRV Regulation',
  'Breathwork',
  'Recovery',
  'Cyclic sighing (5-min daily) reduces state anxiety 22% more than mindfulness meditation. Box breathing (4-4-4-4) shifts autonomic balance toward parasympathetic dominance within 5 minutes.',
  'High',
  'Practice 5 minutes of cyclic sighing (double inhale through nose, long exhale through mouth) daily for anxiety reduction. Use box breathing (4-4-4-4) for acute stress or pre-performance.',
  'core',
  'Reduced state anxiety (-22% vs meditation), increased HRV, parasympathetic activation, improved stress resilience, faster recovery from acute stress.',
  'Hyperventilation techniques (Wim Hof, Tummo) should not be done in water or while driving. Those with respiratory conditions should start gently.',
  'Slow breathing (4-10 breaths/min) activates pulmonary stretch receptors and vagal afferents, signaling the nucleus tractus solitarius to inhibit sympathetic outflow. Extended exhalation increases baroreceptor sensitivity, triggering the carotid sinus reflex for heart rate reduction and blood pressure stabilization. Cyclic sighing specifically resets the respiratory rhythm via double inhale, maximizing alveolar expansion.',
  5, 7,
  '{"duration": {"min": 3, "optimal": 5, "max": 10, "unit": "minutes"}, "breath_rate": {"min": 4, "optimal": 6, "max": 10, "unit": "breaths_per_minute"}}',
  '{"if_anxious": "Try 5 min of cyclic sighing: double inhale nose, long exhale mouth. 22% more effective than meditation.", "if_acute_stress": "Box breathing (4-4-4-4): 4s inhale, 4s hold, 4s exhale, 4s hold. Repeat 4-6 cycles."}',
  '[{"metric": "State anxiety", "baseline": "Elevated", "target": "-22%", "timeline": "Immediate"}, {"metric": "HRV (post-practice)", "baseline": "Baseline", "target": "+10-20%", "timeline": "Immediate"}]',
  ARRAY['https://doi.org/10.1016/j.xcrm.2022.100895'],
  '[{"author": "Balban MY et al.", "year": 2023, "title": "Brief structured respiration practices enhance mood and reduce physiological arousal", "journal": "Cell Reports Medicine", "doi": "10.1016/j.xcrm.2022.100895"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Recovery Protocol 12: Cold Exposure
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, study_sources, is_active
) VALUES (
  'protocol_12_cold_exposure',
  'Cold Exposure',
  'Cold',
  'Recovery',
  '11-minute total cold exposure weekly (split across 2-4 sessions) increases norepinephrine 250-530%, dopamine 250%, and builds resilience to chronic stress.',
  'High',
  '11 minutes total cold water exposure per week, divided into 2-4 sessions of 1-5 minutes each. Water temperature: 50-59°F (10-15°C). End on cold for maximum norepinephrine benefit.',
  'pro',
  'Norepinephrine increase (+250-530%), dopamine increase (+250%), improved stress resilience, enhanced mood, better immune function, increased metabolic rate.',
  'Not for those with cardiovascular conditions, Raynaud''s disease, or cold urticaria. Never practice alone. Avoid hyperventilation. Risk of cold shock response.',
  'Cold exposure activates the sympathetic nervous system, triggering massive norepinephrine release from the locus coeruleus (+250-530%). Dopamine levels in the nucleus accumbens increase by 250% and remain elevated for hours. Repeated exposure builds resilience by teaching the stress response system to activate and recover efficiently. Cold-induced thermogenesis increases brown fat activation and metabolic rate.',
  3, 3,
  '{"temperature": {"min": 50, "optimal": 55, "max": 59, "unit": "fahrenheit"}, "session_duration": {"min": 1, "optimal": 3, "max": 5, "unit": "minutes"}, "weekly_total": {"min": 8, "optimal": 11, "max": 15, "unit": "minutes"}}',
  '{"first_time": "Start with 30 seconds at 59°F and build up. Focus on slow breathing through discomfort.", "end_on_cold": "Always end on cold (no warm shower after) to maximize norepinephrine benefit."}',
  '[{"metric": "Stress tolerance", "baseline": "Baseline", "target": "Improved subjective resilience", "timeline": "2-4 weeks"}, {"metric": "Morning alertness", "baseline": "Baseline", "target": "+1-2 points", "timeline": "1-2 weeks"}]',
  ARRAY['https://doi.org/10.1016/j.ejap.2008.12.041'],
  '[{"author": "Sramek P et al.", "year": 2000, "title": "Human physiological responses to immersion into water of different temperatures", "journal": "European Journal of Applied Physiology", "doi": "10.1007/s004210050065"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  study_sources = EXCLUDED.study_sources,
  updated_at = now();

-- Optimization Protocol 13: Supplements
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, is_active
) VALUES (
  'protocol_13_supplements',
  'Foundational Supplements',
  'Supplements',
  'Optimization',
  'Vitamin D (5,000 IU), Omega-3 (2g EPA/DHA), and Magnesium (400mg) address common deficiencies and optimize sleep, cognition, and mood with strong evidence.',
  'High',
  'Consider baseline supplementation with Vitamin D (5,000 IU/day if deficient), Omega-3 (2g EPA+DHA/day), and Magnesium (300-400mg elemental, preferably threonate or glycinate).',
  'pro',
  'Improved sleep quality (magnesium), better mood stability (omega-3, vitamin D), enhanced cognitive function, reduced inflammation, stronger immune function.',
  'Test vitamin D levels before high-dose supplementation. Fish oil may interact with blood thinners. Magnesium can cause GI issues at high doses.',
  'Vitamin D functions as a neurosteroid, modulating BDNF and serotonin synthesis. Omega-3s (EPA/DHA) maintain neuronal membrane fluidity and reduce neuroinflammation. Magnesium is a cofactor in 300+ enzymatic reactions including GABA synthesis and melatonin production. These nutrients address common modern deficiencies that impair baseline brain function.',
  1, 7,
  '{"vitamin_d": {"min": 1000, "optimal": 5000, "max": 10000, "unit": "IU"}, "omega_3": {"min": 1, "optimal": 2, "max": 3, "unit": "grams_epa_dha"}, "magnesium": {"min": 200, "optimal": 400, "max": 500, "unit": "mg_elemental"}}',
  '{"if_deficient_vitamin_d": "Take 5,000 IU vitamin D daily with a fat-containing meal.", "for_sleep": "Magnesium glycinate or threonate 300-400mg 1-2 hours before bed."}',
  '[{"metric": "Vitamin D level", "baseline": "<30 ng/mL", "target": "40-60 ng/mL", "timeline": "8-12 weeks"}, {"metric": "Sleep quality", "baseline": "Baseline", "target": "+10-15%", "timeline": "2-4 weeks (Mg)"}]',
  ARRAY['https://doi.org/10.3390/nu12051455'],
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  updated_at = now();

-- Optimization Protocol 14: Dopamine
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, is_active
) VALUES (
  'protocol_14_dopamine',
  'Dopamine Optimization',
  'Dopamine',
  'Optimization',
  'Strategic dopamine baseline management through cold exposure (+250%), sunlight (+50%), goal-pursuit behaviors, and reward-delay prevents chronic depletion and maintains motivation.',
  'Moderate',
  'Manage dopamine through behaviors rather than substances: morning cold exposure, sunlight, exercise, goal pursuit with delayed rewards. Avoid chronic high-reward stimuli (social media, junk food) that deplete baseline dopamine.',
  'pro',
  'Sustained motivation, improved focus, better reward sensitivity, reduced anhedonia, healthier relationship with dopamine-releasing activities.',
  'Requires understanding of dopamine dynamics. May need to reduce high-dopamine habits (social media, processed food). Individual variation in baseline dopamine.',
  'Dopamine operates on a tonic (baseline) and phasic (spike) system. Chronic high-reward stimuli (social media scrolling, junk food) create large spikes followed by below-baseline troughs, training the brain to need larger stimuli. Strategic practices like cold exposure (+250% dopamine that remains elevated for hours), sunlight (+50%), and exercise maintain healthy baseline without crash cycles.',
  0, 7,
  '{"cold_exposure_boost": {"min": 100, "optimal": 250, "max": 530, "unit": "percent_increase"}, "sunlight_boost": {"min": 30, "optimal": 50, "max": 100, "unit": "percent_increase"}}',
  '{"avoid_spikes": "Limit social media, video games, and junk food—they create dopamine spikes and crashes.", "healthy_sources": "Use cold exposure, sunlight, exercise, and goal pursuit for sustainable dopamine."}',
  '[{"metric": "Motivation consistency", "baseline": "Variable", "target": "Stable through week", "timeline": "2-4 weeks"}, {"metric": "Reward sensitivity", "baseline": "Blunted", "target": "Restored", "timeline": "4-8 weeks"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  updated_at = now();

-- Optimization Protocol 15: Alcohol
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, is_active
) VALUES (
  'protocol_15_alcohol',
  'Alcohol & Sleep',
  'Alcohol Protocol',
  'Optimization',
  '3-4 hour pre-sleep cutoff prevents REM suppression (15-30% reduction with 2+ drinks), HRV decline (24-39%), and second-half sleep fragmentation.',
  'High',
  'Stop alcohol consumption 4+ hours before your target bedtime. Even moderate drinking (2 drinks) significantly impairs sleep architecture, HRV, and next-day recovery.',
  'core',
  'Preserved REM sleep, maintained HRV, better sleep efficiency, reduced next-day fatigue, improved recovery metrics.',
  'May conflict with social drinking patterns. Individual metabolism varies. Some may need longer cutoffs.',
  'Alcohol is a sedative that initially promotes sleep onset but severely disrupts sleep architecture. It suppresses REM sleep by 15-30% (dose-dependent), causes rebound insomnia in the second half of the night as it metabolizes, and reduces HRV by 24-39% indicating impaired parasympathetic recovery. The half-life of alcohol is 4-5 hours, so a 4-hour cutoff allows substantial clearance.',
  0, 7,
  '{"cutoff_hours": {"min": 3, "optimal": 4, "max": 6, "unit": "hours_before_bed"}, "drinks_limit": {"min": 0, "optimal": 1, "max": 2, "unit": "standard_drinks"}}',
  '{"if_drinking": "Stop alcohol 4+ hours before bed. Tonight''s drink = impaired REM + lower HRV.", "if_late_drink": "Alcohol within 4 hours of bed suppresses REM by 15-30%. Plan earlier consumption."}',
  '[{"metric": "REM sleep duration", "baseline": "-15-30% with late alcohol", "target": "Full REM", "timeline": "Next night"}, {"metric": "HRV next day", "baseline": "-24-39%", "target": "Preserved", "timeline": "Next day"}]',
  ARRAY['https://doi.org/10.1016/j.smrv.2024.101967'],
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  updated_at = now();

-- Optimization Protocol 16: Focus & Information Diet
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, is_active
) VALUES (
  'protocol_16_focus',
  'Focus & Information Diet',
  'Deep Work',
  'Optimization',
  '90-120 minute deep work blocks aligned with ultradian rhythms, smartphone spatial separation (13-16% cognitive load reduction), and batched notifications reduce context-switching by 40%.',
  'High',
  'Structure work in 90-120 minute deep work blocks. Keep smartphone in another room during focus time. Batch check notifications 3x daily instead of continuous monitoring.',
  'pro',
  'Improved focus duration (+40%), reduced cognitive load (-13-16%), better task completion, less mental fatigue, improved work quality.',
  'May conflict with jobs requiring constant availability. Requires discipline and environmental control. Communication expectations need to be set.',
  'The brain operates in ~90-minute ultradian cycles of alertness. Context-switching takes 23+ minutes to return to full focus. Smartphone presence alone—even face down—consumes working memory (13-16% reduction). Batching notifications preserves attentional bandwidth. Deep work blocks aligned with ultradian rhythms maximize cognitive output.',
  105, 5,
  '{"block_duration": {"min": 60, "optimal": 90, "max": 120, "unit": "minutes"}, "daily_blocks": {"min": 1, "optimal": 2, "max": 3, "unit": "blocks"}}',
  '{"start_block": "Begin 90-120 min deep work block. Phone in another room. No notifications.", "between_blocks": "15-20 min break: walk, hydrate, check messages. Then return to deep work."}',
  '[{"metric": "Focus duration", "baseline": "20-30 min", "target": "90+ min", "timeline": "2-4 weeks"}, {"metric": "Task completion", "baseline": "Variable", "target": "+40%", "timeline": "2-4 weeks"}]',
  ARRAY['https://doi.org/10.1016/j.chb.2017.01.016'],
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  updated_at = now();

-- Meta Protocol 17: Cognitive Testing
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, is_active
) VALUES (
  'protocol_17_cognitive_testing',
  'Cognitive Testing & Reflection',
  'Self-Assessment',
  'Meta',
  'Weekly self-assessment (mood, energy, sleep quality + optional cognitive tests) paired with structured reflection increases self-monitoring adherence by 15-40%.',
  'Moderate',
  'Complete weekly self-assessments rating mood, energy, and sleep quality (1-10 scales). Optionally add simple cognitive tests (reaction time, n-back). Reflect on what worked and what to adjust.',
  'core',
  'Improved self-awareness, earlier detection of decline, better protocol adherence (+15-40%), data for AI-driven personalization, structured feedback loop.',
  'Requires consistent weekly practice. Self-report has inherent biases. May cause over-monitoring anxiety in some.',
  'Self-monitoring creates a feedback loop that increases behavior awareness and enables course correction. Weekly reflection transforms data into actionable insights. Structured self-assessment improves adherence by 15-40% through increased accountability and awareness of protocol effects. Cognitive testing provides objective markers beyond subjective feel.',
  10, 1,
  '{"assessment_duration": {"min": 5, "optimal": 10, "max": 15, "unit": "minutes"}, "reflection_duration": {"min": 5, "optimal": 10, "max": 15, "unit": "minutes"}}',
  '{"weekly_check": "Weekly assessment time: rate mood, energy, sleep quality (1-10). What worked this week?", "if_declining": "Scores trending down? Review protocol adherence and identify what changed."}',
  '[{"metric": "Protocol adherence", "baseline": "50-60%", "target": "+15-40%", "timeline": "4-8 weeks"}, {"metric": "Self-awareness", "baseline": "Variable", "target": "Improved", "timeline": "2-4 weeks"}]',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  updated_at = now();

-- Meta Protocol 18: Social Accountability
INSERT INTO public.protocols (
  id, name, short_name, category, summary, evidence_level, description, tier_required,
  benefits, constraints, mechanism_description, duration_minutes, frequency_per_week,
  parameter_ranges, implementation_rules, success_metrics, citations, is_active
) VALUES (
  'protocol_18_social_accountability',
  'Social Connection & Accountability',
  'Accountability',
  'Meta',
  'Peer accountability increases adherence 59-65%. Team-based challenges and supportive (not shame-based) social structures leverage behavioral contagion across 3 degrees of network separation.',
  'High',
  'Find an accountability partner or join a group pursuing similar health goals. Share progress regularly. Participate in supportive (not competitive or shame-based) challenges.',
  'core',
  'Increased adherence (+59-65%), social support, behavioral contagion effects (healthy behaviors spread through networks), reduced isolation, enhanced motivation.',
  'Requires finding appropriate accountability partner or group. Shame-based accountability can backfire. Dependent on quality of social connection.',
  'Social accountability leverages multiple psychological mechanisms: commitment devices (public promises), social proof (seeing others succeed), behavioral contagion (habits spread through networks up to 3 degrees of separation), and supportive scaffolding. Peer accountability increases exercise adherence by 59-65%. Supportive (vs. competitive/shame-based) structures produce lasting change.',
  10, 3,
  '{"check_ins": {"min": 1, "optimal": 3, "max": 7, "unit": "times_per_week"}, "group_size": {"min": 1, "optimal": 3, "max": 10, "unit": "people"}}',
  '{"find_partner": "Find an accountability partner pursuing similar health goals. Check in 2-3x/week.", "share_progress": "Share wins and struggles. Supportive accountability > shame-based competition."}',
  '[{"metric": "Protocol adherence", "baseline": "50-60%", "target": "+59-65%", "timeline": "4-8 weeks"}, {"metric": "Consistency", "baseline": "Variable", "target": "Sustained", "timeline": "4-8 weeks"}]',
  ARRAY['https://doi.org/10.1056/NEJMsa066082'],
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  mechanism_description = EXCLUDED.mechanism_description,
  parameter_ranges = EXCLUDED.parameter_ranges,
  implementation_rules = EXCLUDED.implementation_rules,
  success_metrics = EXCLUDED.success_metrics,
  updated_at = now();

-- Summary of protocols seeded
SELECT
  category,
  COUNT(*) as protocol_count
FROM public.protocols
WHERE is_active = true
GROUP BY category
ORDER BY category;
