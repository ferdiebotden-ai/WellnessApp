/**
 * Manual Check-in Types for Lite Mode (Client)
 *
 * These types mirror the server-side check-in types for use in the
 * React Native client.
 *
 * @file client/src/types/checkIn.ts
 * @author Claude Opus 4.5 (Session 49)
 * @created December 5, 2025
 */

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Quality rating scale (1-5).
 */
export type QualityRating = 1 | 2 | 3 | 4 | 5;

/**
 * Sleep duration options.
 */
export type SleepHoursOption = '<5' | '5-6' | '6-7' | '7-8' | '8+';

/**
 * Display labels for quality ratings.
 */
export const QUALITY_RATING_LABELS: Record<QualityRating, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

/**
 * Emojis for quality ratings.
 */
export const QUALITY_RATING_EMOJIS: Record<QualityRating, string> = {
  1: '😫',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
};

/**
 * Display labels for sleep hours.
 */
export const SLEEP_HOURS_LABELS: Record<SleepHoursOption, string> = {
  '<5': 'Less than 5h',
  '5-6': '5-6 hours',
  '6-7': '6-7 hours',
  '7-8': '7-8 hours',
  '8+': 'More than 8h',
};

// =============================================================================
// CHECK-IN REQUEST/RESPONSE
// =============================================================================

/**
 * Manual check-in input.
 */
export interface ManualCheckInInput {
  sleepQuality: QualityRating;
  sleepHours: SleepHoursOption;
  energyLevel: QualityRating;
}

/**
 * API request body for submitting a check-in.
 */
export interface ManualCheckInRequest {
  sleepQuality: QualityRating;
  sleepHours: SleepHoursOption;
  energyLevel: QualityRating;
  wakeTime?: string;
  timezone?: string;
  skipped?: boolean;
}

/**
 * Check-in component breakdown.
 */
export interface CheckInComponents {
  sleepQuality: {
    rating: QualityRating;
    label: string;
    score: number;
    weight: number;
  };
  sleepDuration: {
    hours: number;
    option: SleepHoursOption;
    score: number;
    vsTarget: string;
    weight: number;
  };
  energyLevel: {
    rating: QualityRating;
    label: string;
    score: number;
    weight: number;
  };
}

/**
 * Recommendation from check-in.
 */
export interface CheckInRecommendation {
  type: 'training' | 'rest' | 'health' | 'recovery';
  headline: string;
  body: string;
  protocols: string[];
}

/**
 * Full check-in result.
 */
export interface CheckInResult {
  score: number;
  zone: 'red' | 'yellow' | 'green';
  confidence: number;
  components: CheckInComponents;
  reasoning: string;
  recommendations: CheckInRecommendation[];
  isLiteMode: true;
  skipped: boolean;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Response from GET /api/manual-check-in/today
 */
export interface GetCheckInResponse {
  hasCheckedIn: boolean;
  checkIn: CheckInResult | null;
  date: string;
}

/**
 * Response from POST /api/manual-check-in
 */
export interface SubmitCheckInResponse {
  success: boolean;
  checkIn: CheckInResult;
  date: string;
}

// =============================================================================
// QUESTIONNAIRE STATE
// =============================================================================

/**
 * Current step in the questionnaire.
 */
export type QuestionnaireStep = 'sleepQuality' | 'sleepHours' | 'energyLevel';

/**
 * Questionnaire state.
 */
export interface QuestionnaireState {
  currentStep: QuestionnaireStep;
  answers: Partial<ManualCheckInInput>;
}

/**
 * Questionnaire question config.
 */
export interface QuestionConfig {
  step: QuestionnaireStep;
  question: string;
  options: Array<{
    value: QualityRating | SleepHoursOption;
    label: string;
    emoji?: string;
  }>;
}

/**
 * All questionnaire questions.
 */
export const QUESTIONNAIRE_QUESTIONS: QuestionConfig[] = [
  {
    step: 'sleepQuality',
    question: 'How did you sleep?',
    options: [
      { value: 1, label: 'Poor', emoji: '😫' },
      { value: 2, label: 'Fair', emoji: '😕' },
      { value: 3, label: 'Okay', emoji: '😐' },
      { value: 4, label: 'Good', emoji: '🙂' },
      { value: 5, label: 'Great', emoji: '😊' },
    ],
  },
  {
    step: 'sleepHours',
    question: 'How long did you sleep?',
    options: [
      { value: '<5', label: '<5h' },
      { value: '5-6', label: '5-6h' },
      { value: '6-7', label: '6-7h' },
      { value: '7-8', label: '7-8h' },
      { value: '8+', label: '8+h' },
    ],
  },
  {
    step: 'energyLevel',
    question: "What's your energy level?",
    options: [
      { value: 1, label: 'Low', emoji: '😫' },
      { value: 2, label: 'Fair', emoji: '😕' },
      { value: 3, label: 'Okay', emoji: '😐' },
      { value: 4, label: 'Good', emoji: '🙂' },
      { value: 5, label: 'High', emoji: '😊' },
    ],
  },
];
