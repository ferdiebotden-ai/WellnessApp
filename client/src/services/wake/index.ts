/**
 * Wake Detection Services - Client-side Barrel Export
 *
 * @file client/src/services/wake/index.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

// HealthKit wake detection
export {
  HealthKitWakeDetector,
  getHealthKitWakeDetector,
  type HealthKitWakeResult,
} from './HealthKitWakeDetector';

// Phone unlock wake detection (Lite Mode)
export {
  PhoneUnlockDetector,
  getPhoneUnlockDetector,
  type PhoneUnlockResult,
  type WakeDetectedCallback,
} from './PhoneUnlockDetector';

// API service
export {
  WakeEventService,
  getWakeEventService,
  type WakeSource,
  type SendWakeEventInput,
  type WakeEventResponse,
  type TodayWakeEventResponse,
} from './WakeEventService';
