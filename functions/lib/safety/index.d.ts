/**
 * Safety Module - Public API
 *
 * Exports crisis detection and AI output safety scanning functions.
 * Follows barrel export pattern from suppression/ and memory/ modules.
 */
export type { CrisisSeverity, CrisisKeyword, CrisisDetectionResult, CrisisResource, AIOutputScanResult, CrisisAuditEntry, } from './types';
export { SAFETY_CONFIG, SEVERITY_PRIORITY } from './types';
export { CRISIS_KEYWORDS, CRISIS_RESOURCES, getResourcesForSeverity, getHighestSeverity, getUniqueSeverities, } from './crisisRules';
export { detectCrisis, generateCrisisResponse, requiresImmediateIntervention, normalizeText, hasExclusionMatch, findMatchingKeywords, getSeverityDescription, } from './crisisDetection';
export { scanAIOutput, getSafeFallbackResponse, shouldSuppressOutput, } from './aiOutputScanner';
