/**
 * Wake Detection Services - Client-side Barrel Export
 *
 * @file client/src/services/wake/index.ts
 * @author Claude Opus 4.5 (Session 42)
 * @updated December 5, 2025 - Added Health Connect support (Session 50)
 */

// HealthKit wake detection (iOS)
export {
  HealthKitWakeDetector,
  getHealthKitWakeDetector,
  type HealthKitWakeResult,
} from './HealthKitWakeDetector';

// Health Connect wake detection (Android)
export {
  HealthConnectWakeDetector,
  getHealthConnectWakeDetector,
  type HealthConnectWakeResult,
} from './HealthConnectWakeDetector';

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
