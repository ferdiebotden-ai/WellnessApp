/**
 * Services Module Index
 *
 * Exports all service functions for use across the application.
 *
 * @file functions/src/services/index.ts
 */

// Recovery Score Service
export {
  calculateRecoveryScore,
  calculateHrvScore,
  calculateRhrScore,
  calculateSleepQualityScore,
  calculateSleepDurationScore,
  calculateRespiratoryRateScore,
  calculateTemperaturePenalty,
  detectEdgeCases,
  generateRecommendations,
  shouldCalculateRecovery,
  getBaselineStatus,
  COMPONENT_WEIGHTS,
  type RecoveryInput,
} from './recoveryScore';

// Baseline Service
export {
  getUserBaseline,
  updateUserBaseline,
  initializeBaseline,
  updateMenstrualTracking,
  getBaselineStatus as getBaselineStatusFromDb,
} from './baselineService';
