/**
 * Safety Module - Public API
 *
 * Exports crisis detection and AI output safety scanning functions.
 * Follows barrel export pattern from suppression/ and memory/ modules.
 */

// Types
export type {
  CrisisSeverity,
  CrisisKeyword,
  CrisisDetectionResult,
  CrisisResource,
  AIOutputScanResult,
  CrisisAuditEntry,
} from './types';

// Constants
export { SAFETY_CONFIG, SEVERITY_PRIORITY } from './types';

// Crisis Rules
export {
  CRISIS_KEYWORDS,
  CRISIS_RESOURCES,
  getResourcesForSeverity,
  getHighestSeverity,
  getUniqueSeverities,
} from './crisisRules';

// Crisis Detection
export {
  detectCrisis,
  generateCrisisResponse,
  requiresImmediateIntervention,
  normalizeText,
  hasExclusionMatch,
  findMatchingKeywords,
  getSeverityDescription,
} from './crisisDetection';

// AI Output Scanner
export {
  scanAIOutput,
  getSafeFallbackResponse,
  shouldSuppressOutput,
} from './aiOutputScanner';
