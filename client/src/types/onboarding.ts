/**
 * Onboarding Types
 * Used in the conversational AI onboarding flow
 */

/** User's primary wellness goal selected during onboarding */
export type PrimaryGoal = 'better_sleep' | 'more_energy' | 'sharper_focus' | 'faster_recovery';

/** Wearable device options for tracking */
export type WearableSource = 'oura' | 'whoop' | 'apple_watch' | 'garmin';

/** Health platform for data sync */
export type HealthPlatform = 'apple_health' | 'health_connect';

/** Goal card data for onboarding selection */
export interface OnboardingGoal {
  id: PrimaryGoal;
  icon: string;
  label: string;
  description: string;
  /** Module ID that maps to this goal */
  relatedModule: string;
}

/** Wearable option for onboarding selection */
export interface OnboardingWearable {
  id: WearableSource;
  name: string;
  icon: string;
  /** Platforms this wearable option is shown on */
  platforms: ('ios' | 'android' | 'web')[];
}

/** Biological sex for HRV baseline personalization */
export type BiologicalSex = 'male' | 'female' | 'prefer_not_to_say';

/** Biometric profile data collected during onboarding */
export interface BiometricProfileData {
  birthDate: Date | null;
  biologicalSex: BiologicalSex | null;
  heightCm: number | null;
  weightKg: number | null;
  timezone: string;
}

/** Starter protocol data for onboarding selection */
export interface StarterProtocol {
  id: string;
  name: string;
  short_name: string;
  summary: string;
  category: string;
  /** Default scheduled time in HH:MM format */
  default_time: string;
}

/** Onboarding completion payload */
export interface OnboardingCompletePayload {
  primary_goal: PrimaryGoal;
  wearable_source?: WearableSource | null;
  health_platform?: HealthPlatform | null;
  /** Derived from goal → module mapping */
  primary_module_id?: string;
  /** Biometric profile data */
  biometrics?: BiometricProfileData | null;
  /** Protocol IDs user selected during onboarding to enroll in */
  selected_protocol_ids?: string[];
}

/** Goal → Module mapping for enrollment
 * Maps user goals from onboarding to actual module IDs in the database.
 * Module IDs must match public.modules table: mod_sleep, mod_morning_routine, mod_focus_productivity
 */
export const GOAL_TO_MODULE_MAP: Record<PrimaryGoal, string> = {
  better_sleep: 'mod_sleep',
  more_energy: 'mod_morning_routine',
  sharper_focus: 'mod_focus_productivity',
  faster_recovery: 'mod_sleep', // Recovery starts with sleep optimization
};

/**
 * Multi-goal → Modules mapping
 * Each goal maps to primary + related modules for comprehensive protocol coverage.
 * Used when user selects multiple goals during onboarding.
 */
export const GOAL_TO_MODULES_MAP: Record<PrimaryGoal, string[]> = {
  better_sleep: ['mod_sleep', 'mod_morning_routine'],
  more_energy: ['mod_morning_routine', 'mod_focus_productivity'],
  sharper_focus: ['mod_focus_productivity', 'mod_morning_routine'],
  faster_recovery: ['mod_sleep', 'mod_focus_productivity'],
};

/**
 * Get unique module IDs for an array of goals.
 * Deduplicates modules when multiple goals share the same module.
 */
export function getModulesForGoals(goals: PrimaryGoal[]): string[] {
  const moduleSet = new Set<string>();
  goals.forEach((goal) => {
    const modules = GOAL_TO_MODULES_MAP[goal];
    modules.forEach((m) => moduleSet.add(m));
  });
  return Array.from(moduleSet);
}

/**
 * Get the primary module for an array of goals.
 * Returns the first goal's primary module.
 */
export function getPrimaryModuleForGoals(goals: PrimaryGoal[]): string {
  if (goals.length === 0) return 'mod_sleep';
  return GOAL_TO_MODULE_MAP[goals[0]];
}

/** Available goals for onboarding */
export const ONBOARDING_GOALS: OnboardingGoal[] = [
  {
    id: 'better_sleep',
    icon: '🌙',
    label: 'Better Sleep',
    description: 'Optimize sleep quality, duration, and consistency',
    relatedModule: 'mod_sleep',
  },
  {
    id: 'more_energy',
    icon: '⚡',
    label: 'More Energy',
    description: 'Boost metabolic efficiency and sustained focus',
    relatedModule: 'mod_morning_routine',
  },
  {
    id: 'sharper_focus',
    icon: '🎯',
    label: 'Sharper Focus',
    description: 'Enhance cognitive performance and mental clarity',
    relatedModule: 'mod_focus_productivity',
  },
  {
    id: 'faster_recovery',
    icon: '💪',
    label: 'Faster Recovery',
    description: 'Accelerate adaptation and reduce inflammation',
    relatedModule: 'mod_sleep',
  },
];

/** Available wearables for onboarding */
export const ONBOARDING_WEARABLES: OnboardingWearable[] = [
  { id: 'oura', name: 'Oura Ring', icon: '⭕', platforms: ['ios', 'android'] },
  { id: 'whoop', name: 'WHOOP', icon: '📊', platforms: ['ios', 'android'] },
  { id: 'apple_watch', name: 'Apple Watch', icon: '⌚', platforms: ['ios'] },
  { id: 'garmin', name: 'Garmin', icon: '🏃', platforms: ['ios', 'android'] },
];

/** Health platform option for onboarding health data sync */
export interface OnboardingHealthPlatform {
  id: HealthPlatform;
  name: string;
  icon: string;
  description: string;
  platform: 'ios' | 'android';
}

/** Available health platforms for syncing health data */
export const HEALTH_PLATFORMS: OnboardingHealthPlatform[] = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    icon: '❤️',
    description: 'Access steps, sleep, heart rate & more',
    platform: 'ios',
  },
  {
    id: 'health_connect',
    name: 'Health Connect',
    icon: '💚',
    description: 'Access steps, sleep, heart rate & more',
    platform: 'android',
  },
];
