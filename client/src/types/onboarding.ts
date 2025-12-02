/**
 * Onboarding Types
 * Used in the conversational AI onboarding flow
 */

/** User's primary wellness goal selected during onboarding */
export type PrimaryGoal = 'better_sleep' | 'more_energy' | 'sharper_focus' | 'faster_recovery';

/** Wearable device options for tracking */
export type WearableSource = 'oura' | 'whoop' | 'apple_health' | 'google_fit' | 'garmin';

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
}

/** Onboarding completion payload */
export interface OnboardingCompletePayload {
  primary_goal: PrimaryGoal;
  wearable_source?: WearableSource | null;
  /** Derived from goal → module mapping */
  primary_module_id?: string;
}

/** Goal → Module mapping for enrollment */
export const GOAL_TO_MODULE_MAP: Record<PrimaryGoal, string> = {
  better_sleep: 'sleep_foundations',
  more_energy: 'metabolic_reset',
  sharper_focus: 'metabolic_reset',
  faster_recovery: 'stress_resilience',
};

/** Available goals for onboarding */
export const ONBOARDING_GOALS: OnboardingGoal[] = [
  {
    id: 'better_sleep',
    icon: '🌙',
    label: 'Better Sleep',
    description: 'Optimize sleep quality, duration, and consistency',
    relatedModule: 'sleep_foundations',
  },
  {
    id: 'more_energy',
    icon: '⚡',
    label: 'More Energy',
    description: 'Boost metabolic efficiency and sustained focus',
    relatedModule: 'metabolic_reset',
  },
  {
    id: 'sharper_focus',
    icon: '🎯',
    label: 'Sharper Focus',
    description: 'Enhance cognitive performance and mental clarity',
    relatedModule: 'metabolic_reset',
  },
  {
    id: 'faster_recovery',
    icon: '💪',
    label: 'Faster Recovery',
    description: 'Accelerate adaptation and reduce inflammation',
    relatedModule: 'stress_resilience',
  },
];

/** Available wearables for onboarding */
export const ONBOARDING_WEARABLES: OnboardingWearable[] = [
  { id: 'oura', name: 'Oura Ring', icon: '⭕' },
  { id: 'whoop', name: 'WHOOP', icon: '📊' },
  { id: 'apple_health', name: 'Apple Watch', icon: '⌚' },
  { id: 'google_fit', name: 'Google Fit', icon: '📱' },
  { id: 'garmin', name: 'Garmin', icon: '🏃' },
];
