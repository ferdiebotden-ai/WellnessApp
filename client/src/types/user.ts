export interface UserPreferences {
  primary_module_id?: string;
  nudge_tone?: 'motivational' | 'neutral' | 'minimal';
  quiet_hours_enabled?: boolean;
  quiet_start_time?: string; // HH:MM
  quiet_end_time?: string; // HH:MM
  social_anonymous?: boolean; // Default: true
}

export interface ModuleEnrollmentRow {
  id: string;
  module_id: string;
  user_id: string;
  current_streak?: number;
  longest_streak?: number;
  progress_pct?: number;
  enrolled_at: string;
  last_active_date?: string;
}

export interface UserProfile {
  id: string;
  email?: string | null;
  display_name?: string | null;
  tier: string;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  onboarding_complete?: boolean;
  preferences?: UserPreferences;
  healthMetrics?: Record<string, unknown>;
  earnedBadges?: string[];
  subscription_id?: string | null;
  module_enrollment?: ModuleEnrollmentRow[];
  /** Primary wellness goal selected during onboarding */
  primary_goal?: 'better_sleep' | 'more_energy' | 'sharper_focus' | 'faster_recovery' | null;
  /** Wearable device the user tracks with, selected during onboarding */
  wearable_source?: 'oura' | 'whoop' | 'apple_health' | 'google_fit' | 'garmin' | null;
  /** User birth date for age-based personalization (ISO date string) */
  birth_date?: string | null;
  /** Biological sex for HRV baseline calibration */
  biological_sex?: 'male' | 'female' | 'prefer_not_to_say' | null;
  /** Height in centimeters */
  height_cm?: number | null;
  /** Weight in kilograms */
  weight_kg?: number | null;
  /** User timezone for nudge scheduling */
  timezone?: string | null;
  /** Last weight update timestamp */
  weight_updated_at?: string | null;
}
