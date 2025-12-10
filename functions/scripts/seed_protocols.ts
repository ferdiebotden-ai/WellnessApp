/**
 * Protocol Seeding Script
 *
 * Seeds the protocols table with enriched data from Master_Protocol_Library.md
 * Includes mechanism descriptions, parameters, and study sources for evidence transparency.
 *
 * Usage: npx ts-node supabase/seed_protocols.ts
 *
 * @session 59
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// =============================================================================
// PROTOCOL DATA — Extracted from Master_Protocol_Library.md
// =============================================================================

interface ProtocolData {
  id: string;
  name: string;
  short_name: string;
  category: 'Foundation' | 'Performance' | 'Recovery' | 'Optimization' | 'Meta';
  summary: string;
  evidence_level: 'Very High' | 'High' | 'Moderate' | 'Low';
  description: string;
  tier_required: 'core' | 'pro' | 'elite';
  benefits: string;
  constraints: string;
  mechanism_description: string;
  duration_minutes: number;
  frequency_per_week: number;
  parameter_ranges: Record<string, unknown>;
  implementation_rules: Record<string, string>;
  success_metrics: Array<{
    metric: string;
    baseline: string;
    target: string;
    timeline: string;
  }>;
  citations: string[];
  study_sources: Array<{
    author: string;
    year: number;
    title: string;
    journal: string;
    doi: string;
  }>;
  is_active: boolean;
}

const PROTOCOLS: ProtocolData[] = [
  // ============== FOUNDATION PROTOCOLS (1-4) ==============
  {
    id: 'protocol_1_morning_light',
    name: 'Morning Light Exposure',
    short_name: 'Morning Light',
    category: 'Foundation',
    summary: 'Morning light (10-30 min, ≥1,000 lux, within 60 min of waking) advances sleep phase by 0.5-2.7 hours and improves sleep efficiency by 10-15% within 1-2 weeks.',
    evidence_level: 'Very High',
    description: 'Get 10-30 minutes of outdoor light exposure within the first hour of waking. This is the single highest-impact protocol for circadian optimization. Even cloudy outdoor light (1,000-5,000 lux) is 10-100x brighter than indoor lighting.',
    tier_required: 'core',
    benefits: 'Sleep phase advance (0.5-2.7 hours), sleep efficiency improvement (10-15%), cortisol awakening response amplification (>50%), mood enhancement via dopamine/serotonin pathways, reduced morning grogginess.',
    constraints: 'Requires outdoor access or 10,000 lux light therapy lamp. Indoor ambient lighting (<500 lux) is insufficient. Effectiveness depends on consistency (6-7 days/week). Sunglasses block the benefit.',
    mechanism_description: 'Melanopsin-containing retinal ganglion cells (ipRGCs) detect blue light (~480nm) and signal directly to the suprachiasmatic nucleus (SCN) via the retinohypothalamic tract. This resets your master circadian clock, triggering cortisol release and suppressing melatonin. The SCN then synchronizes peripheral clocks throughout your body, aligning sleep-wake cycles with the solar day.',
    duration_minutes: 15,
    frequency_per_week: 7,
    parameter_ranges: {
      intensity: { min: 1000, optimal: 5000, max: 10000, unit: 'lux' },
      timing: { min: 0, optimal: 30, max: 60, unit: 'minutes_post_wake' },
      duration: { min: 10, optimal: 15, max: 30, unit: 'minutes' },
    },
    implementation_rules: {
      if_sunny_outdoor: 'Perfect! Sunny outdoor light is optimal. Just 10 minutes needed.',
      if_cloudy_outdoor: 'Even cloudy outdoor light works great. Aim for 15 minutes.',
      if_indoor_window: 'Window light is okay, but try to step outside for even 5 min if possible.',
      if_indoor_ambient: 'Indoor light is too dim. Consider a 10,000 lux light therapy lamp, or step outside.',
    },
    success_metrics: [
      { metric: 'Sleep efficiency', baseline: '75%', target: '85%+', timeline: '2-4 weeks' },
      { metric: 'Sleep onset latency', baseline: '45 min', target: '15-20 min', timeline: '1-2 weeks' },
      { metric: 'Wake time consistency', baseline: '±60 min', target: '±30 min', timeline: '2 weeks' },
    ],
    citations: [
      'https://doi.org/10.1016/j.cub.2013.06.039',
      'https://doi.org/10.1001/archpsyc.58.1.69',
      'https://doi.org/10.1210/jcem.86.1.7102',
      'https://doi.org/10.1016/j.smrv.2014.11.004',
    ],
    study_sources: [
      { author: 'Wright KP et al.', year: 2013, title: 'Entrainment of the human circadian clock to the natural light-dark cycle', journal: 'Current Biology', doi: '10.1016/j.cub.2013.06.039' },
      { author: 'Terman M et al.', year: 2001, title: 'Circadian time of morning light administration and therapeutic response in winter depression', journal: 'Archives of General Psychiatry', doi: '10.1001/archpsyc.58.1.69' },
      { author: 'Leproult R et al.', year: 2001, title: 'Transition from dim to bright light induces immediate cortisol elevation', journal: 'Journal of Clinical Endocrinology & Metabolism', doi: '10.1210/jcem.86.1.7102' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_2_evening_light',
    name: 'Evening Light Management',
    short_name: 'Evening Light',
    category: 'Foundation',
    summary: 'Dim lights <50 lux and minimize blue light 2-3 hours before sleep to preserve melatonin secretion and optimize sleep onset. Bright evening light delays circadian phase by 1-3 hours.',
    evidence_level: 'High',
    description: 'Starting 2-3 hours before your target bedtime, dim overhead lights to <50 lux (candlelight level) and use blue light filters on all screens. In the final hour before sleep, eliminate screens entirely if possible.',
    tier_required: 'core',
    benefits: 'Preserved melatonin onset, faster sleep onset (10-15 min improvement), stable circadian phase, reduced sleep onset latency, improved REM sleep duration.',
    constraints: 'Requires behavioral change in evening routine. May conflict with work demands or social activities. Blue light filters reduce but don\'t eliminate screen impact.',
    mechanism_description: 'Evening light exposure suppresses melatonin synthesis in the pineal gland by up to 55-71%. Light detected by ipRGCs signals "daytime" to the SCN, which inhibits melatonin release. This delays your dim-light melatonin onset (DLMO) and shifts your circadian phase later, making it harder to fall asleep at your desired time.',
    duration_minutes: 120,
    frequency_per_week: 7,
    parameter_ranges: {
      ambient_light: { min: 0, optimal: 10, max: 50, unit: 'lux' },
      timing_before_bed: { min: 2, optimal: 3, max: 4, unit: 'hours' },
    },
    implementation_rules: {
      if_2h_before_bed: 'Start dimming lights and enable blue light filters on all devices.',
      if_1h_before_bed: 'Time to dim lights to candlelight level and put away screens.',
      if_screens_needed: 'Use amber-tinted blue light blocking glasses (filter >90% blue light).',
    },
    success_metrics: [
      { metric: 'Sleep onset latency', baseline: '30+ min', target: '<15 min', timeline: '1-2 weeks' },
      { metric: 'Subjective sleepiness onset', baseline: 'Variable', target: 'Consistent 30 min pre-bed', timeline: '1 week' },
    ],
    citations: [
      'https://doi.org/10.1073/pnas.1418490112',
      'https://doi.org/10.1210/jc.2010-2098',
      'https://doi.org/10.1093/sleep/zsaa194',
    ],
    study_sources: [
      { author: 'Chang AM et al.', year: 2015, title: 'Evening use of light-emitting eReaders negatively affects sleep', journal: 'PNAS', doi: '10.1073/pnas.1418490112' },
      { author: 'Gooley JJ et al.', year: 2011, title: 'Exposure to room light before bedtime suppresses melatonin onset', journal: 'Journal of Clinical Endocrinology & Metabolism', doi: '10.1210/jc.2010-2098' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_3_sleep_optimization',
    name: 'Sleep Optimization',
    short_name: 'Sleep',
    category: 'Foundation',
    summary: 'Optimize sleep through temperature control (60-67°F), pre-sleep warm baths 90 min before bedtime, meal cutoffs 3h prior, and bedtime consistency ±30 min.',
    evidence_level: 'Very High',
    description: 'A multi-factor approach to sleep quality: bedroom temperature 65°F (60-67°F range), warm bath 90 minutes before sleep, finish eating 3 hours before bed, stop alcohol 4+ hours before bed, and maintain consistent bedtime ±30 minutes.',
    tier_required: 'core',
    benefits: 'Improved sleep architecture, faster sleep onset, better sleep efficiency, enhanced deep sleep duration, reduced night awakenings, improved next-day energy and cognition.',
    constraints: 'Requires lifestyle adjustments. Late dinners and evening alcohol are common challenges. Temperature control may require A/C or fan investment.',
    mechanism_description: 'Sleep onset requires a 1-2°F drop in core body temperature. Cool room temperature (60-67°F) facilitates heat dissipation. A warm bath 90 min before bed causes vasodilation and heat loss, accelerating the natural temperature decline. Late meals prevent temperature drop and suppress melatonin. Alcohol suppresses REM sleep and causes fragmentation in the second half of the night.',
    duration_minutes: 480,
    frequency_per_week: 7,
    parameter_ranges: {
      bedroom_temp: { min: 60, optimal: 65, max: 67, unit: 'fahrenheit' },
      bath_timing: { min: 60, optimal: 90, max: 120, unit: 'minutes_before_bed' },
      meal_cutoff: { min: 2, optimal: 3, max: 4, unit: 'hours_before_bed' },
      alcohol_cutoff: { min: 3, optimal: 4, max: 6, unit: 'hours_before_bed' },
      bedtime_variance: { min: 0, optimal: 0, max: 30, unit: 'minutes' },
    },
    implementation_rules: {
      if_room_too_warm: 'Room temp above 70°F reduces sleep quality. Lower thermostat to 65°F.',
      if_late_dinner: 'Late eating delays melatonin. Finish eating 3 hours before bed tomorrow.',
      if_alcohol_late: 'Alcohol within 4 hours of bed suppresses REM. Plan earlier consumption.',
    },
    success_metrics: [
      { metric: 'Sleep efficiency', baseline: '75%', target: '>85%', timeline: '2-4 weeks' },
      { metric: 'Deep sleep duration', baseline: 'Variable', target: '+15-20%', timeline: '2-4 weeks' },
      { metric: 'Next-day energy', baseline: '5/10', target: '7+/10', timeline: '1-2 weeks' },
    ],
    citations: [
      'https://doi.org/10.1093/sleep/zsaa056.1208',
      'https://doi.org/10.1016/j.smrv.2019.04.002',
      'https://doi.org/10.1016/j.smrv.2024.101967',
      'https://doi.org/10.1016/j.smrv.2020.101340',
    ],
    study_sources: [
      { author: 'Haghayegh S et al.', year: 2019, title: 'Before-bedtime passive body heating by warm shower or bath to improve sleep', journal: 'Sleep Medicine Reviews', doi: '10.1016/j.smrv.2019.04.002' },
      { author: 'Gardiner C et al.', year: 2024, title: 'The effect of alcohol on subsequent sleep', journal: 'Sleep Medicine Reviews', doi: '10.1016/j.smrv.2024.101967' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_4_hydration',
    name: 'Hydration & Electrolytes',
    short_name: 'Hydration',
    category: 'Foundation',
    summary: 'Even mild dehydration (1-2%) significantly impairs mood, concentration, and executive function. Morning hydration (16-32 oz + electrolytes within 30 min of waking) optimizes alertness.',
    evidence_level: 'High',
    description: 'Drink 16-32 oz of water with electrolytes (500mg sodium, 200mg potassium, 100mg magnesium) within 30 minutes of waking. Daily target: body weight in lbs ÷ 2 = ounces of water.',
    tier_required: 'core',
    benefits: 'Enhanced alertness within 30-60 min of morning hydration, improved mood, better concentration, supported cortisol awakening response, reduced afternoon fatigue.',
    constraints: 'Requires morning routine adjustment. Those with kidney disease or hypertension need modified sodium intake. Risk of overhydration if excessive water without electrolytes.',
    mechanism_description: 'Overnight, you lose approximately 1 liter of water through respiration and perspiration. Even 1-2% dehydration impairs cerebral blood flow and neurotransmitter synthesis, affecting mood, concentration, and executive function. Morning electrolytes (Na+, K+, Mg2+) support the sodium-potassium pump essential for neural signaling and optimize the cortisol awakening response.',
    duration_minutes: 5,
    frequency_per_week: 7,
    parameter_ranges: {
      morning_volume: { min: 500, optimal: 750, max: 1000, unit: 'mL' },
      sodium: { min: 500, optimal: 750, max: 1000, unit: 'mg' },
      potassium: { min: 200, optimal: 300, max: 400, unit: 'mg' },
      magnesium: { min: 100, optimal: 150, max: 200, unit: 'mg' },
    },
    implementation_rules: {
      on_wake: 'Drink 16-32 oz water + electrolytes within 30 min of waking.',
      during_day: 'Track hydration—aim for body weight (lbs) ÷ 2 = daily oz.',
      if_exercising: 'Add 16-24 oz post-workout for sessions >60 min.',
    },
    success_metrics: [
      { metric: 'Morning alertness', baseline: 'Groggy', target: 'Alert within 30 min', timeline: '3-7 days' },
      { metric: 'Urine color', baseline: 'Dark yellow', target: 'Pale yellow (2-4)', timeline: '3-7 days' },
      { metric: 'Energy stability', baseline: 'Variable', target: '+1-2 points', timeline: '1-2 weeks' },
    ],
    citations: [
      'https://doi.org/10.3945/jn.111.142000',
      'https://doi.org/10.1017/S0007114513004455',
    ],
    study_sources: [
      { author: 'Armstrong LE et al.', year: 2012, title: 'Mild dehydration affects mood in healthy young women', journal: 'The Journal of Nutrition', doi: '10.3945/jn.111.142000' },
      { author: 'Masento NA et al.', year: 2014, title: 'Effects of hydration status on cognitive performance and mood', journal: 'British Journal of Nutrition', doi: '10.1017/S0007114513004455' },
    ],
    is_active: true,
  },

  // ============== PERFORMANCE PROTOCOLS (5-9) ==============
  {
    id: 'protocol_5_caffeine_timing',
    name: 'Caffeine Timing & Cutoff',
    short_name: 'Caffeine',
    category: 'Performance',
    summary: 'Caffeine cutoff 8-10 hours before bedtime preserves sleep onset, architecture, and quality. 400mg doses show significant disruption even 12 hours before bed.',
    evidence_level: 'High',
    description: 'Stop caffeine consumption 8-10 hours before your target bedtime (10 hours for poor sleepers or sensitive individuals). Daily limit: 400mg for healthy adults. Optional: delay first caffeine 90-120 min post-wake.',
    tier_required: 'core',
    benefits: 'Faster sleep onset, preserved deep sleep duration, better sleep efficiency, reduced night awakenings, more consistent morning alertness.',
    constraints: 'May require adjustment for those dependent on afternoon caffeine. Half-life varies by genetics (CYP1A2). Pregnant women should limit to 200mg/day.',
    mechanism_description: 'Caffeine is a competitive antagonist at adenosine receptors. Adenosine accumulates during wakefulness and creates "sleep pressure." Caffeine blocks this signal without clearing adenosine—so when caffeine wears off (half-life 4-6 hours), the accumulated adenosine floods receptors, causing the "crash." Late caffeine prevents the natural adenosine signal that promotes sleep onset.',
    duration_minutes: 0,
    frequency_per_week: 7,
    parameter_ranges: {
      cutoff_hours: { min: 8, optimal: 10, max: 12, unit: 'hours_before_bed' },
      daily_limit: { min: 0, optimal: 200, max: 400, unit: 'mg' },
      first_dose_delay: { min: 0, optimal: 90, max: 120, unit: 'minutes_post_wake' },
    },
    implementation_rules: {
      if_poor_sleeper: 'Extend cutoff to 10 hours before bedtime.',
      if_afternoon_crash: 'Try delaying first caffeine 90-120 min after waking.',
      at_cutoff_time: 'Last call for caffeine. Cut off now = better sleep tonight.',
    },
    success_metrics: [
      { metric: 'Sleep onset latency', baseline: '30+ min', target: '<15 min', timeline: '3-7 days' },
      { metric: 'Total sleep time', baseline: '-45 min deficit', target: 'Full 7-8h', timeline: '1 week' },
      { metric: 'Deep sleep', baseline: 'Reduced', target: '+10-15 min', timeline: '1-2 weeks' },
    ],
    citations: [
      'https://doi.org/10.5664/jcsm.3170',
      'https://doi.org/10.1093/sleep/zsae230',
      'https://doi.org/10.1126/scitranslmed.aac5125',
    ],
    study_sources: [
      { author: 'Drake C et al.', year: 2013, title: 'Caffeine effects on sleep taken 0, 3, or 6 hours before bed', journal: 'Journal of Clinical Sleep Medicine', doi: '10.5664/jcsm.3170' },
      { author: 'Burke TM et al.', year: 2015, title: 'Effects of caffeine on the human circadian clock', journal: 'Science Translational Medicine', doi: '10.1126/scitranslmed.aac5125' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_6_morning_movement',
    name: 'Morning Movement',
    short_name: 'AM Movement',
    category: 'Performance',
    summary: 'Light-to-moderate aerobic exercise (Zone 2, 50-70% max HR) within 30-90 min of waking enhances cortisol awakening response by 50-75% and releases catecholamines.',
    evidence_level: 'High',
    description: '10-30 minutes of Zone 2 exercise (conversational pace) within 30-90 minutes of waking. Outdoor walking combines this with morning light exposure for maximum benefit.',
    tier_required: 'core',
    benefits: 'Amplified cortisol awakening response (+50-75%), increased dopamine and norepinephrine, enhanced alertness for 6-8 hours, reinforced circadian entrainment.',
    constraints: 'Requires time in morning routine. May need to wake earlier. Weather-dependent for outdoor options. HRV-aware—skip if HRV is significantly below baseline.',
    mechanism_description: 'Morning exercise activates the sympathetic nervous system and HPA axis, amplifying the natural cortisol awakening response by 50-75%. The resulting catecholamine release (dopamine, norepinephrine) provides sustained alertness. Combined with outdoor light, this creates a powerful circadian anchor that reinforces wake-time consistency.',
    duration_minutes: 20,
    frequency_per_week: 5,
    parameter_ranges: {
      timing_post_wake: { min: 30, optimal: 45, max: 90, unit: 'minutes' },
      duration: { min: 10, optimal: 20, max: 30, unit: 'minutes' },
      intensity: { min: 50, optimal: 65, max: 70, unit: 'percent_max_hr' },
    },
    implementation_rules: {
      on_wake: 'Time for morning movement! 10-30 min Zone 2 amplifies your cortisol awakening response.',
      if_low_hrv: 'HRV is low today—keep movement to light walking only.',
      if_evening_chronotype: 'As an evening type, you may need 60-120 min post-wake for movement.',
    },
    success_metrics: [
      { metric: 'Morning alertness', baseline: 'Groggy 1-2h', target: 'Alert within 30 min', timeline: '1-2 weeks' },
      { metric: 'Energy through day', baseline: 'Variable', target: '+1-2 points', timeline: '1-2 weeks' },
      { metric: 'Wake time consistency', baseline: '±45 min', target: '±20 min', timeline: '4 weeks' },
    ],
    citations: [
      'https://doi.org/10.1007/s00421-019-04136-9',
      'https://doi.org/10.1038/s41598-025-02659-8',
    ],
    study_sources: [
      { author: 'Drogos LL et al.', year: 2019, title: 'Aerobic exercise increases cortisol awakening response in older adults', journal: 'European Journal of Applied Physiology', doi: '10.1007/s00421-019-04136-9' },
      { author: 'Shen B et al.', year: 2025, title: 'Differential benefits of morning vs. evening exercise', journal: 'Scientific Reports', doi: '10.1038/s41598-025-02659-8' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_7_walking_breaks',
    name: 'Walking Breaks & Micro-Movement',
    short_name: 'Walking Breaks',
    category: 'Performance',
    summary: '2-5 min light walking every 20-30 min during sedentary work reduces postprandial glucose by 17-58%, preserves cerebral blood flow, and improves cognitive function.',
    evidence_level: 'Very High',
    description: 'Take 2-5 minute walking breaks every 20-30 minutes during sedentary work. Priority: walk within 10-15 minutes after meals to blunt glucose spikes by 30-50%.',
    tier_required: 'core',
    benefits: 'Reduced glucose spikes (17-58%), preserved cerebral blood flow, improved prefrontal cortex oxygenation, sustained attention, reduced afternoon energy crashes.',
    constraints: 'May conflict with meeting schedules or focused work. Requires awareness and discipline. Can use standing or seated micro-movements as alternatives.',
    mechanism_description: 'Prolonged sitting reduces middle cerebral artery velocity by 3.2 cm/s, impairing cognitive function. Walking activates muscle GLUT4 transporters, enabling insulin-independent glucose uptake that blunts post-meal spikes. Brief movement restores cerebral blood flow and prefrontal cortex oxygenation, maintaining attention and executive function.',
    duration_minutes: 3,
    frequency_per_week: 7,
    parameter_ranges: {
      break_interval: { min: 15, optimal: 20, max: 30, unit: 'minutes' },
      break_duration: { min: 2, optimal: 3, max: 5, unit: 'minutes' },
      daily_breaks: { min: 4, optimal: 6, max: 8, unit: 'breaks' },
    },
    implementation_rules: {
      after_30min_sitting: 'Time for a 2-5 min walking break! This prevents glucose spikes and keeps your brain sharp.',
      post_meal: 'Perfect timing for a 3-5 min walk! Post-meal movement prevents glucose spikes by 30-50%.',
      if_in_meeting: 'Pause walking nudges during meetings—catch-up break after.',
    },
    success_metrics: [
      { metric: 'Postprandial glucose spike', baseline: 'High', target: '-30 to -50%', timeline: 'Same day' },
      { metric: 'Afternoon energy crashes', baseline: '5-7x/week', target: '0-2x/week', timeline: '2-3 weeks' },
      { metric: 'Daily step count', baseline: '<5,000', target: '+2,000-3,000', timeline: '2-4 weeks' },
    ],
    citations: [
      'https://doi.org/10.2337/dc11-1931',
      'https://doi.org/10.1152/japplphysiol.00310.2018',
    ],
    study_sources: [
      { author: 'Dunstan DW et al.', year: 2012, title: 'Breaking up prolonged sitting reduces postprandial glucose and insulin responses', journal: 'Diabetes Care', doi: '10.2337/dc11-1931' },
      { author: 'Carter SE et al.', year: 2018, title: 'Regular walking breaks prevent the decline in cerebral blood flow', journal: 'Journal of Applied Physiology', doi: '10.1152/japplphysiol.00310.2018' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_8_nutrition',
    name: 'Nutrition for Cognitive Stability',
    short_name: 'Brain Nutrition',
    category: 'Performance',
    summary: 'Protein-driven neurotransmitter synthesis (0.8-1.2 g/kg), low-glycemic carbs (GI <55), 8-10h eating window, and UPF <10-15% synergistically support cognitive stability.',
    evidence_level: 'High',
    description: 'Consume 0.8-1.2 g/kg body weight of protein distributed across meals (emphasize ≥20g at dinner). Choose low-GI carbohydrates. Finish eating 2-3 hours before sleep. Limit ultra-processed foods to <10-15% of daily calories.',
    tier_required: 'core',
    benefits: 'Stable blood glucose, sustained focus, reduced afternoon crashes, improved neurotransmitter synthesis (dopamine, serotonin), better sleep quality, reduced cognitive decline risk.',
    constraints: 'Requires meal planning and awareness. May conflict with social eating patterns. Not appropriate for those with eating disorder history (use principles-based approach instead).',
    mechanism_description: 'Protein provides tyrosine (dopamine precursor) and tryptophan (serotonin precursor). Low-GI carbohydrates sustain glucose delivery without reactive hypoglycemia. Time-restricted eating aligns peripheral circadian clocks. Ultra-processed foods (>20% daily calories) accelerate cognitive decline by 28% over 8 years via neuroinflammation.',
    duration_minutes: 0,
    frequency_per_week: 7,
    parameter_ranges: {
      protein_per_kg: { min: 0.8, optimal: 1.0, max: 1.2, unit: 'g_per_kg' },
      dinner_protein: { min: 15, optimal: 20, max: 30, unit: 'grams' },
      glycemic_index: { min: 0, optimal: 40, max: 55, unit: 'GI_score' },
      eating_window: { min: 8, optimal: 9, max: 10, unit: 'hours' },
      upf_limit: { min: 0, optimal: 10, max: 15, unit: 'percent_calories' },
    },
    implementation_rules: {
      if_high_gi_meal: 'High-GI foods cause glucose crashes. Swap white rice → brown rice, sugary cereal → steel-cut oats.',
      if_late_dinner: 'Late eating delays melatonin. Finish eating 2-3h before bed tomorrow.',
      if_high_upf: 'Ultra-processed foods (>20% daily calories) linked to 28% faster cognitive decline.',
    },
    success_metrics: [
      { metric: 'Afternoon energy crashes', baseline: '5-7x/week', target: '0-2x/week', timeline: '2-3 weeks' },
      { metric: 'Focus duration', baseline: 'Variable', target: '+20-30%', timeline: '2-4 weeks' },
      { metric: 'Sleep quality', baseline: 'Variable', target: '+10-15%', timeline: '2-4 weeks' },
    ],
    citations: [
      'https://doi.org/10.1017/S0954422424000271',
      'https://doi.org/10.3945/an.113.004960',
      'https://doi.org/10.1001/jamaneurol.2022.4397',
      'https://doi.org/10.1210/endrev/bnab027',
    ],
    study_sources: [
      { author: 'Adams MS et al.', year: 2025, title: 'Effects of dietary proteins on cognitive performance', journal: 'Nutrition Research Reviews', doi: '10.1017/S0954422424000271' },
      { author: 'Gonçalves NG et al.', year: 2023, title: 'Association between consumption of ultraprocessed foods and cognitive decline', journal: 'JAMA Neurology', doi: '10.1001/jamaneurol.2022.4397' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_9_fitness_for_focus',
    name: 'Fitness for Focus',
    short_name: 'Fitness',
    category: 'Performance',
    summary: 'Aerobic exercise (Zone 2, 3-5x/week × 30-60 min) is the most potent BDNF stimulus. Combined with resistance training (2-3x/week), it improves executive function by 20-30%.',
    evidence_level: 'Very High',
    description: 'Aim for 3-5 aerobic sessions (Zone 2, 30-60 min) plus 2-3 resistance training sessions per week. This combination produces the largest executive function and neuroplasticity gains.',
    tier_required: 'core',
    benefits: 'BDNF upregulation (+15-30% baseline), hippocampal volume increase (+1-2%), improved working memory, better inhibitory control, enhanced synaptic plasticity, reversed age-related brain atrophy.',
    constraints: 'Requires significant time investment (4-6 hours/week). Medical clearance needed for sedentary individuals >40 with cardiovascular risk factors. Must monitor HRV for recovery.',
    mechanism_description: 'Aerobic exercise is the most potent behavioral stimulus for brain-derived neurotrophic factor (BDNF), which promotes hippocampal neurogenesis and synaptic plasticity. Resistance training activates myogenic factors (irisin, IGF-1) that cross the blood-brain barrier and upregulate BDNF via independent pathways. Combined training produces 20-30% larger cognitive gains than aerobic alone.',
    duration_minutes: 45,
    frequency_per_week: 5,
    parameter_ranges: {
      aerobic_sessions: { min: 2, optimal: 4, max: 5, unit: 'sessions_per_week' },
      aerobic_duration: { min: 30, optimal: 45, max: 60, unit: 'minutes' },
      resistance_sessions: { min: 1, optimal: 2, max: 3, unit: 'sessions_per_week' },
      total_sessions: { min: 3, optimal: 5, max: 6, unit: 'sessions_per_week' },
    },
    implementation_rules: {
      if_beginner: 'Start with 3 sessions/week: 2 aerobic (30 min) + 1 resistance (30 min).',
      if_low_hrv: 'HRV is low—rest day recommended. Skip vigorous exercise; light Zone 2 walk only.',
      if_high_readiness: 'Your recovery is excellent. Great day to push hard on workouts!',
    },
    success_metrics: [
      { metric: 'Working memory (n-back)', baseline: 'Baseline', target: '+20% effect size', timeline: '4-8 weeks' },
      { metric: 'Executive function (Stroop)', baseline: 'Baseline', target: '>10% improvement', timeline: '4-8 weeks' },
      { metric: 'Hippocampal volume', baseline: 'Baseline', target: '+1-2%', timeline: '6-12 months' },
    ],
    citations: [
      'https://doi.org/10.1073/pnas.1015950108',
      'https://doi.org/10.3389/fnins.2022.895765',
      'https://doi.org/10.3233/BPL-160040',
      'https://doi.org/10.1136/bjsports-2024-108257',
    ],
    study_sources: [
      { author: 'Erickson KI et al.', year: 2011, title: 'Exercise training increases size of hippocampus and improves memory', journal: 'PNAS', doi: '10.1073/pnas.1015950108' },
      { author: 'Basso JC & Suzuki WA', year: 2017, title: 'The effects of acute exercise on mood, cognition, neurophysiology', journal: 'Brain Plasticity', doi: '10.3233/BPL-160040' },
    ],
    is_active: true,
  },

  // ============== RECOVERY PROTOCOLS (10-12) ==============
  {
    id: 'protocol_10_nsdr',
    name: 'NSDR (Non-Sleep Deep Rest)',
    short_name: 'NSDR',
    category: 'Recovery',
    summary: '10-20 minute daily NSDR practice (Yoga Nidra, body scan, hypnosis) increases dopamine by 65%, improves HRV recovery by 8-15%, and enhances sleep quality when practiced pre-bedtime.',
    evidence_level: 'High',
    description: 'Practice 10-30 minutes of NSDR (Yoga Nidra, body scan, or hypnosis) daily. For dopamine boost, practice midday (1-2 PM). For sleep enhancement, practice 30-60 minutes before bedtime.',
    tier_required: 'core',
    benefits: 'Dopamine increase (+65% striatal dopamine), HRV recovery (+8-15%), cortisol reduction (-20-25%), faster sleep onset (-8-12 min), enhanced subjective rest.',
    constraints: 'Requires quiet environment. May induce drowsiness if timed incorrectly. Those with severe PTSD or psychosis should use modified approaches under supervision.',
    mechanism_description: 'NSDR shifts cortical activity from beta (alert) to theta (4-8 Hz, deep relaxation) brain waves. PET imaging shows Yoga Nidra increases striatal dopamine by 65%, comparable to rewarding stimuli but achieved through rest. This activates the parasympathetic nervous system, increases HRV, and reduces cortisol, creating a restorative state distinct from sleep.',
    duration_minutes: 20,
    frequency_per_week: 7,
    parameter_ranges: {
      duration: { min: 10, optimal: 20, max: 30, unit: 'minutes' },
      timing_before_bed: { min: 30, optimal: 45, max: 60, unit: 'minutes' },
    },
    implementation_rules: {
      if_stressed: 'NSDR (Yoga Nidra) recovers faster than meditation—try midday + pre-bedtime.',
      if_poor_sleep: 'Practice NSDR 30-60 min before bed. Expect 12-18% sleep quality improvement by Week 3.',
      if_midday_dip: 'Midday NSDR (1-2 PM) maximizes dopamine restoration and afternoon alertness.',
    },
    success_metrics: [
      { metric: 'Stress rating', baseline: '7/10', target: '5/10', timeline: '1-2 weeks' },
      { metric: 'HRV recovery', baseline: 'Baseline', target: '+8-15%', timeline: '2-3 weeks' },
      { metric: 'Sleep quality', baseline: 'Baseline', target: '+12-18%', timeline: '3-4 weeks' },
    ],
    citations: [
      'https://doi.org/10.1016/j.neuroimage.2002.04.003',
    ],
    study_sources: [
      { author: 'Kjaer TW et al.', year: 2002, title: 'Increased dopamine tone during meditation-induced change of consciousness', journal: 'Cognitive Brain Research', doi: '10.1016/S0926-6410(02)00068-X' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_11_breathwork',
    name: 'Breathwork & HRV Regulation',
    short_name: 'Breathwork',
    category: 'Recovery',
    summary: 'Cyclic sighing (5-min daily) reduces state anxiety 22% more than mindfulness meditation. Box breathing (4-4-4-4) shifts autonomic balance toward parasympathetic dominance within 5 minutes.',
    evidence_level: 'High',
    description: 'Practice 5 minutes of cyclic sighing (double inhale through nose, long exhale through mouth) daily for anxiety reduction. Use box breathing (4-4-4-4) for acute stress or pre-performance.',
    tier_required: 'core',
    benefits: 'Reduced state anxiety (-22% vs meditation), increased HRV, parasympathetic activation, improved stress resilience, faster recovery from acute stress.',
    constraints: 'Hyperventilation techniques (Wim Hof, Tummo) should not be done in water or while driving. Those with respiratory conditions should start gently.',
    mechanism_description: 'Slow breathing (4-10 breaths/min) activates pulmonary stretch receptors and vagal afferents, signaling the nucleus tractus solitarius to inhibit sympathetic outflow. Extended exhalation increases baroreceptor sensitivity, triggering the carotid sinus reflex for heart rate reduction and blood pressure stabilization. Cyclic sighing specifically resets the respiratory rhythm via double inhale, maximizing alveolar expansion.',
    duration_minutes: 5,
    frequency_per_week: 7,
    parameter_ranges: {
      duration: { min: 3, optimal: 5, max: 10, unit: 'minutes' },
      breath_rate: { min: 4, optimal: 6, max: 10, unit: 'breaths_per_minute' },
    },
    implementation_rules: {
      if_anxious: 'Try 5 min of cyclic sighing: double inhale nose, long exhale mouth. 22% more effective than meditation.',
      if_acute_stress: 'Box breathing (4-4-4-4): 4s inhale, 4s hold, 4s exhale, 4s hold. Repeat 4-6 cycles.',
      before_sleep: 'Physiological sighs (double inhale + long exhale) help transition to sleep.',
    },
    success_metrics: [
      { metric: 'State anxiety', baseline: 'Elevated', target: '-22%', timeline: 'Immediate' },
      { metric: 'HRV (post-practice)', baseline: 'Baseline', target: '+10-20%', timeline: 'Immediate' },
      { metric: 'Stress resilience', baseline: 'Variable', target: 'Improved recovery speed', timeline: '2-4 weeks' },
    ],
    citations: [
      'https://doi.org/10.1016/j.xcrm.2022.100895',
    ],
    study_sources: [
      { author: 'Balban MY et al.', year: 2023, title: 'Brief structured respiration practices enhance mood and reduce physiological arousal', journal: 'Cell Reports Medicine', doi: '10.1016/j.xcrm.2022.100895' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_12_cold_exposure',
    name: 'Cold Exposure',
    short_name: 'Cold',
    category: 'Recovery',
    summary: '11-minute total cold exposure weekly (split across 2-4 sessions) increases norepinephrine 250-530%, dopamine 250%, and builds resilience to chronic stress.',
    evidence_level: 'High',
    description: '11 minutes total cold water exposure per week, divided into 2-4 sessions of 1-5 minutes each. Water temperature: 50-59°F (10-15°C). End on cold for maximum norepinephrine benefit.',
    tier_required: 'pro',
    benefits: 'Norepinephrine increase (+250-530%), dopamine increase (+250%), improved stress resilience, enhanced mood, better immune function, increased metabolic rate.',
    constraints: 'Not for those with cardiovascular conditions, Raynaud\'s disease, or cold urticaria. Never practice alone. Avoid hyperventilation. Risk of cold shock response.',
    mechanism_description: 'Cold exposure activates the sympathetic nervous system, triggering massive norepinephrine release from the locus coeruleus (+250-530%). Dopamine levels in the nucleus accumbens increase by 250% and remain elevated for hours. Repeated exposure builds resilience by teaching the stress response system to activate and recover efficiently. Cold-induced thermogenesis increases brown fat activation and metabolic rate.',
    duration_minutes: 3,
    frequency_per_week: 3,
    parameter_ranges: {
      temperature: { min: 50, optimal: 55, max: 59, unit: 'fahrenheit' },
      session_duration: { min: 1, optimal: 3, max: 5, unit: 'minutes' },
      weekly_total: { min: 8, optimal: 11, max: 15, unit: 'minutes' },
      sessions_per_week: { min: 2, optimal: 3, max: 4, unit: 'sessions' },
    },
    implementation_rules: {
      first_time: 'Start with 30 seconds at 59°F and build up. Focus on slow breathing through discomfort.',
      end_on_cold: 'Always end on cold (no warm shower after) to maximize norepinephrine benefit.',
      timing: 'Morning cold exposure amplifies cortisol awakening response. Avoid within 2h of sleep.',
    },
    success_metrics: [
      { metric: 'Stress tolerance', baseline: 'Baseline', target: 'Improved subjective resilience', timeline: '2-4 weeks' },
      { metric: 'Morning alertness', baseline: 'Baseline', target: '+1-2 points', timeline: '1-2 weeks' },
      { metric: 'Mood stability', baseline: 'Variable', target: 'More stable', timeline: '2-4 weeks' },
    ],
    citations: [
      'https://doi.org/10.1016/j.ejap.2008.12.041',
    ],
    study_sources: [
      { author: 'Sramek P et al.', year: 2000, title: 'Human physiological responses to immersion into water of different temperatures', journal: 'European Journal of Applied Physiology', doi: '10.1007/s004210050065' },
    ],
    is_active: true,
  },

  // ============== OPTIMIZATION PROTOCOLS (13-16) ==============
  {
    id: 'protocol_13_supplements',
    name: 'Foundational Supplements',
    short_name: 'Supplements',
    category: 'Optimization',
    summary: 'Vitamin D (5,000 IU), Omega-3 (2g EPA/DHA), and Magnesium (400mg) address common deficiencies and optimize sleep, cognition, and mood with strong evidence.',
    evidence_level: 'High',
    description: 'Consider baseline supplementation with Vitamin D (5,000 IU/day if deficient), Omega-3 (2g EPA+DHA/day), and Magnesium (300-400mg elemental, preferably threonate or glycinate).',
    tier_required: 'pro',
    benefits: 'Improved sleep quality (magnesium), better mood stability (omega-3, vitamin D), enhanced cognitive function, reduced inflammation, stronger immune function.',
    constraints: 'Test vitamin D levels before high-dose supplementation. Fish oil may interact with blood thinners. Magnesium can cause GI issues at high doses.',
    mechanism_description: 'Vitamin D functions as a neurosteroid, modulating BDNF and serotonin synthesis. Omega-3s (EPA/DHA) maintain neuronal membrane fluidity and reduce neuroinflammation. Magnesium is a cofactor in 300+ enzymatic reactions including GABA synthesis and melatonin production. These nutrients address common modern deficiencies that impair baseline brain function.',
    duration_minutes: 1,
    frequency_per_week: 7,
    parameter_ranges: {
      vitamin_d: { min: 1000, optimal: 5000, max: 10000, unit: 'IU' },
      omega_3: { min: 1, optimal: 2, max: 3, unit: 'grams_epa_dha' },
      magnesium: { min: 200, optimal: 400, max: 500, unit: 'mg_elemental' },
    },
    implementation_rules: {
      if_deficient_vitamin_d: 'Take 5,000 IU vitamin D daily with a fat-containing meal.',
      for_sleep: 'Magnesium glycinate or threonate 300-400mg 1-2 hours before bed.',
      for_mood: 'Omega-3 (2g EPA+DHA) daily. Effects take 4-8 weeks.',
    },
    success_metrics: [
      { metric: 'Vitamin D level', baseline: '<30 ng/mL', target: '40-60 ng/mL', timeline: '8-12 weeks' },
      { metric: 'Sleep quality', baseline: 'Baseline', target: '+10-15%', timeline: '2-4 weeks (Mg)' },
      { metric: 'Mood stability', baseline: 'Baseline', target: 'Improved', timeline: '4-8 weeks (Omega-3)' },
    ],
    citations: [
      'https://doi.org/10.3390/nu12051455',
    ],
    study_sources: [
      { author: 'Grosso G et al.', year: 2014, title: 'Role of omega-3 fatty acids in the treatment of depressive disorders', journal: 'PLOS ONE', doi: '10.1371/journal.pone.0096905' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_14_dopamine',
    name: 'Dopamine Optimization',
    short_name: 'Dopamine',
    category: 'Optimization',
    summary: 'Strategic dopamine baseline management through cold exposure (+250%), sunlight (+50%), goal-pursuit behaviors, and reward-delay prevents chronic depletion and maintains motivation.',
    evidence_level: 'Moderate',
    description: 'Manage dopamine through behaviors rather than substances: morning cold exposure, sunlight, exercise, goal pursuit with delayed rewards. Avoid chronic high-reward stimuli (social media, junk food) that deplete baseline dopamine.',
    tier_required: 'pro',
    benefits: 'Sustained motivation, improved focus, better reward sensitivity, reduced anhedonia, healthier relationship with dopamine-releasing activities.',
    constraints: 'Requires understanding of dopamine dynamics. May need to reduce high-dopamine habits (social media, processed food). Individual variation in baseline dopamine.',
    mechanism_description: 'Dopamine operates on a tonic (baseline) and phasic (spike) system. Chronic high-reward stimuli (social media scrolling, junk food) create large spikes followed by below-baseline troughs, training the brain to need larger stimuli. Strategic practices like cold exposure (+250% dopamine that remains elevated for hours), sunlight (+50%), and exercise maintain healthy baseline without crash cycles.',
    duration_minutes: 0,
    frequency_per_week: 7,
    parameter_ranges: {
      cold_exposure_boost: { min: 100, optimal: 250, max: 530, unit: 'percent_increase' },
      sunlight_boost: { min: 30, optimal: 50, max: 100, unit: 'percent_increase' },
    },
    implementation_rules: {
      avoid_spikes: 'Limit social media, video games, and junk food—they create dopamine spikes and crashes.',
      healthy_sources: 'Use cold exposure, sunlight, exercise, and goal pursuit for sustainable dopamine.',
      delay_rewards: 'Celebrate achievements AFTER completion, not during, to maintain motivation.',
    },
    success_metrics: [
      { metric: 'Motivation consistency', baseline: 'Variable', target: 'Stable through week', timeline: '2-4 weeks' },
      { metric: 'Reward sensitivity', baseline: 'Blunted', target: 'Restored', timeline: '4-8 weeks' },
      { metric: 'Focus duration', baseline: 'Variable', target: '+20-30%', timeline: '2-4 weeks' },
    ],
    citations: [],
    study_sources: [],
    is_active: true,
  },
  {
    id: 'protocol_15_alcohol',
    name: 'Alcohol & Sleep',
    short_name: 'Alcohol Protocol',
    category: 'Optimization',
    summary: '3-4 hour pre-sleep cutoff prevents REM suppression (15-30% reduction with 2+ drinks), HRV decline (24-39%), and second-half sleep fragmentation.',
    evidence_level: 'High',
    description: 'Stop alcohol consumption 4+ hours before your target bedtime. Even moderate drinking (2 drinks) significantly impairs sleep architecture, HRV, and next-day recovery.',
    tier_required: 'core',
    benefits: 'Preserved REM sleep, maintained HRV, better sleep efficiency, reduced next-day fatigue, improved recovery metrics.',
    constraints: 'May conflict with social drinking patterns. Individual metabolism varies. Some may need longer cutoffs.',
    mechanism_description: 'Alcohol is a sedative that initially promotes sleep onset but severely disrupts sleep architecture. It suppresses REM sleep by 15-30% (dose-dependent), causes rebound insomnia in the second half of the night as it metabolizes, and reduces HRV by 24-39% indicating impaired parasympathetic recovery. The half-life of alcohol is 4-5 hours, so a 4-hour cutoff allows substantial clearance.',
    duration_minutes: 0,
    frequency_per_week: 7,
    parameter_ranges: {
      cutoff_hours: { min: 3, optimal: 4, max: 6, unit: 'hours_before_bed' },
      drinks_limit: { min: 0, optimal: 1, max: 2, unit: 'standard_drinks' },
    },
    implementation_rules: {
      if_drinking: 'Stop alcohol 4+ hours before bed. Tonight\'s drink = impaired REM + lower HRV.',
      if_late_drink: 'Alcohol within 4 hours of bed suppresses REM by 15-30%. Plan earlier consumption.',
      for_best_sleep: 'For optimal sleep, avoid alcohol entirely or limit to 1 drink, 4+ hours before bed.',
    },
    success_metrics: [
      { metric: 'REM sleep duration', baseline: '-15-30% with late alcohol', target: 'Full REM', timeline: 'Next night' },
      { metric: 'HRV next day', baseline: '-24-39%', target: 'Preserved', timeline: 'Next day' },
      { metric: 'Sleep quality score', baseline: 'Reduced', target: 'Normal', timeline: 'Next night' },
    ],
    citations: [
      'https://doi.org/10.1016/j.smrv.2024.101967',
    ],
    study_sources: [
      { author: 'Gardiner C et al.', year: 2024, title: 'The effect of alcohol on subsequent sleep', journal: 'Sleep Medicine Reviews', doi: '10.1016/j.smrv.2024.101967' },
    ],
    is_active: true,
  },
  {
    id: 'protocol_16_focus',
    name: 'Focus & Information Diet',
    short_name: 'Deep Work',
    category: 'Optimization',
    summary: '90-120 minute deep work blocks aligned with ultradian rhythms, smartphone spatial separation (13-16% cognitive load reduction), and batched notifications reduce context-switching by 40%.',
    evidence_level: 'High',
    description: 'Structure work in 90-120 minute deep work blocks. Keep smartphone in another room during focus time. Batch check notifications 3x daily instead of continuous monitoring.',
    tier_required: 'pro',
    benefits: 'Improved focus duration (+40%), reduced cognitive load (-13-16%), better task completion, less mental fatigue, improved work quality.',
    constraints: 'May conflict with jobs requiring constant availability. Requires discipline and environmental control. Communication expectations need to be set.',
    mechanism_description: 'The brain operates in ~90-minute ultradian cycles of alertness. Context-switching takes 23+ minutes to return to full focus. Smartphone presence alone—even face down—consumes working memory (13-16% reduction). Batching notifications preserves attentional bandwidth. Deep work blocks aligned with ultradian rhythms maximize cognitive output.',
    duration_minutes: 105,
    frequency_per_week: 5,
    parameter_ranges: {
      block_duration: { min: 60, optimal: 90, max: 120, unit: 'minutes' },
      daily_blocks: { min: 1, optimal: 2, max: 3, unit: 'blocks' },
      notification_checks: { min: 2, optimal: 3, max: 4, unit: 'times_per_day' },
    },
    implementation_rules: {
      start_block: 'Begin 90-120 min deep work block. Phone in another room. No notifications.',
      between_blocks: '15-20 min break: walk, hydrate, check messages. Then return to deep work.',
      end_of_day: 'Batch notification processing 3x daily: morning, midday, end of workday.',
    },
    success_metrics: [
      { metric: 'Focus duration', baseline: '20-30 min', target: '90+ min', timeline: '2-4 weeks' },
      { metric: 'Task completion', baseline: 'Variable', target: '+40%', timeline: '2-4 weeks' },
      { metric: 'Mental fatigue', baseline: 'High end-of-day', target: 'Reduced', timeline: '1-2 weeks' },
    ],
    citations: [
      'https://doi.org/10.1016/j.chb.2017.01.016',
    ],
    study_sources: [
      { author: 'Ward AF et al.', year: 2017, title: 'Brain Drain: The Mere Presence of One\'s Own Smartphone Reduces Available Cognitive Capacity', journal: 'Journal of the Association for Consumer Research', doi: '10.1086/691462' },
    ],
    is_active: true,
  },

  // ============== META PROTOCOLS (17-18) ==============
  {
    id: 'protocol_17_cognitive_testing',
    name: 'Cognitive Testing & Reflection',
    short_name: 'Self-Assessment',
    category: 'Meta',
    summary: 'Weekly self-assessment (mood, energy, sleep quality + optional cognitive tests) paired with structured reflection increases self-monitoring adherence by 15-40%.',
    evidence_level: 'Moderate',
    description: 'Complete weekly self-assessments rating mood, energy, and sleep quality (1-10 scales). Optionally add simple cognitive tests (reaction time, n-back). Reflect on what worked and what to adjust.',
    tier_required: 'core',
    benefits: 'Improved self-awareness, earlier detection of decline, better protocol adherence (+15-40%), data for AI-driven personalization, structured feedback loop.',
    constraints: 'Requires consistent weekly practice. Self-report has inherent biases. May cause over-monitoring anxiety in some.',
    mechanism_description: 'Self-monitoring creates a feedback loop that increases behavior awareness and enables course correction. Weekly reflection transforms data into actionable insights. Structured self-assessment improves adherence by 15-40% through increased accountability and awareness of protocol effects. Cognitive testing provides objective markers beyond subjective feel.',
    duration_minutes: 10,
    frequency_per_week: 1,
    parameter_ranges: {
      assessment_duration: { min: 5, optimal: 10, max: 15, unit: 'minutes' },
      reflection_duration: { min: 5, optimal: 10, max: 15, unit: 'minutes' },
    },
    implementation_rules: {
      weekly_check: 'Weekly assessment time: rate mood, energy, sleep quality (1-10). What worked this week?',
      if_declining: 'Scores trending down? Review protocol adherence and identify what changed.',
      if_improving: 'Scores improving! Note which protocols contributed most. Double down on those.',
    },
    success_metrics: [
      { metric: 'Protocol adherence', baseline: '50-60%', target: '+15-40%', timeline: '4-8 weeks' },
      { metric: 'Self-awareness', baseline: 'Variable', target: 'Improved', timeline: '2-4 weeks' },
      { metric: 'Early issue detection', baseline: 'Reactive', target: 'Proactive', timeline: '4 weeks' },
    ],
    citations: [],
    study_sources: [],
    is_active: true,
  },
  {
    id: 'protocol_18_social_accountability',
    name: 'Social Connection & Accountability',
    short_name: 'Accountability',
    category: 'Meta',
    summary: 'Peer accountability increases adherence 59-65%. Team-based challenges and supportive (not shame-based) social structures leverage behavioral contagion across 3 degrees of network separation.',
    evidence_level: 'High',
    description: 'Find an accountability partner or join a group pursuing similar health goals. Share progress regularly. Participate in supportive (not competitive or shame-based) challenges.',
    tier_required: 'core',
    benefits: 'Increased adherence (+59-65%), social support, behavioral contagion effects (healthy behaviors spread through networks), reduced isolation, enhanced motivation.',
    constraints: 'Requires finding appropriate accountability partner or group. Shame-based accountability can backfire. Dependent on quality of social connection.',
    mechanism_description: 'Social accountability leverages multiple psychological mechanisms: commitment devices (public promises), social proof (seeing others succeed), behavioral contagion (habits spread through networks up to 3 degrees of separation), and supportive scaffolding. Peer accountability increases exercise adherence by 59-65%. Supportive (vs. competitive/shame-based) structures produce lasting change.',
    duration_minutes: 10,
    frequency_per_week: 3,
    parameter_ranges: {
      check_ins: { min: 1, optimal: 3, max: 7, unit: 'times_per_week' },
      group_size: { min: 1, optimal: 3, max: 10, unit: 'people' },
    },
    implementation_rules: {
      find_partner: 'Find an accountability partner pursuing similar health goals. Check in 2-3x/week.',
      share_progress: 'Share wins and struggles. Supportive accountability > shame-based competition.',
      join_challenge: 'Consider joining a group challenge for extra motivation and community.',
    },
    success_metrics: [
      { metric: 'Protocol adherence', baseline: '50-60%', target: '+59-65%', timeline: '4-8 weeks' },
      { metric: 'Consistency', baseline: 'Variable', target: 'Sustained', timeline: '4-8 weeks' },
      { metric: 'Motivation', baseline: 'Variable', target: 'Improved', timeline: '2-4 weeks' },
    ],
    citations: [
      'https://doi.org/10.1056/NEJMsa066082',
    ],
    study_sources: [
      { author: 'Christakis NA & Fowler JH', year: 2007, title: 'The Spread of Obesity in a Large Social Network', journal: 'New England Journal of Medicine', doi: '10.1056/NEJMsa066082' },
    ],
    is_active: true,
  },
];

// =============================================================================
// SEEDING FUNCTION
// =============================================================================

async function seedProtocols(): Promise<void> {
  console.log('🌱 Starting protocol seeding...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const protocol of PROTOCOLS) {
    try {
      const { error } = await supabase.from('protocols').upsert(
        {
          id: protocol.id,
          name: protocol.name,
          short_name: protocol.short_name,
          category: protocol.category,
          summary: protocol.summary,
          evidence_level: protocol.evidence_level,
          description: protocol.description,
          tier_required: protocol.tier_required,
          benefits: protocol.benefits,
          constraints: protocol.constraints,
          mechanism_description: protocol.mechanism_description,
          duration_minutes: protocol.duration_minutes,
          frequency_per_week: protocol.frequency_per_week,
          parameter_ranges: protocol.parameter_ranges,
          implementation_rules: protocol.implementation_rules,
          success_metrics: protocol.success_metrics,
          citations: protocol.citations,
          study_sources: protocol.study_sources,
          is_active: protocol.is_active,
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error(`❌ Failed to seed ${protocol.name}: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ Seeded: ${protocol.name} (${protocol.category})`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception seeding ${protocol.name}:`, err);
      errorCount++;
    }
  }

  console.log('\n📊 Seeding complete!');
  console.log(`   ✅ Success: ${successCount}/${PROTOCOLS.length}`);
  console.log(`   ❌ Errors: ${errorCount}/${PROTOCOLS.length}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run seeding
seedProtocols().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
