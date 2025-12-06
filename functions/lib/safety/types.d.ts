/**
 * Safety Module Types
 *
 * Type definitions for crisis detection and AI output safety scanning.
 * Follows patterns established in suppression/types.ts and memory/types.ts.
 */
/**
 * Severity levels for crisis detection
 * - high: Immediate risk to life (suicide, overdose)
 * - medium: Self-harm, severe distress
 * - low: Eating disorders, general mental health concerns
 */
export type CrisisSeverity = 'low' | 'medium' | 'high';
/**
 * Crisis keyword definition with severity and contextual exclusions
 */
export interface CrisisKeyword {
    /** The phrase to detect (lowercase) */
    phrase: string;
    /** Severity level of this keyword */
    severity: CrisisSeverity;
    /** Phrases that negate crisis detection (false positive prevention) */
    exclusions?: string[];
}
/**
 * Result of crisis detection analysis
 */
export interface CrisisDetectionResult {
    /** Whether a crisis was detected */
    detected: boolean;
    /** Highest severity level detected, null if not detected */
    severity: CrisisSeverity | null;
    /** List of matched keyword phrases */
    matchedKeywords: string[];
    /** Crisis resources appropriate for the detected severity */
    resources: CrisisResource[];
    /** Whether this detection should be logged to audit trail */
    shouldLog: boolean;
}
/**
 * Mental health crisis resource
 */
export interface CrisisResource {
    /** Resource name (e.g., "988 Suicide & Crisis Lifeline") */
    name: string;
    /** Brief description of the resource */
    description: string;
    /** How to contact (e.g., "Call or text 988") */
    contact: string;
    /** Type of contact method */
    type: 'hotline' | 'text' | 'website' | 'chat';
    /** Which severities this resource is shown for */
    forSeverities: CrisisSeverity[];
    /** Display priority (lower = shown first) */
    priority: number;
}
/**
 * Result of AI output safety scan
 */
export interface AIOutputScanResult {
    /** Whether the output is safe to deliver */
    safe: boolean;
    /** If not safe, which keywords triggered */
    flaggedKeywords: string[];
    /** Severity of any detected issues */
    severity: CrisisSeverity | null;
    /** Reason for flagging (if not safe) */
    reason?: string;
}
/**
 * Audit log entry for crisis assessment
 */
export interface CrisisAuditEntry {
    /** Type of decision for audit log */
    decision_type: 'crisis_assessment';
    /** Detected severity (null if no crisis) */
    severity: CrisisSeverity | null;
    /** Keywords that triggered detection */
    keywords_detected: string[];
    /** Names of resources shown to user */
    resources_shown: string[];
    /** Whether this was determined to be a false positive */
    was_false_positive: boolean;
    /** Source of the text (user_input, ai_response, nudge) */
    source: 'user_input' | 'ai_response' | 'nudge';
}
/**
 * Safety module configuration constants
 */
export declare const SAFETY_CONFIG: {
    /** Maximum characters to scan (performance limit) */
    readonly MAX_SCAN_LENGTH: 5000;
    /** Log all scans (including non-detections) for debugging */
    readonly LOG_ALL_SCANS: false;
    /** Number of resources to show for high severity */
    readonly HIGH_SEVERITY_RESOURCE_COUNT: 4;
    /** Number of resources to show for medium severity */
    readonly MEDIUM_SEVERITY_RESOURCE_COUNT: 3;
    /** Number of resources to show for low severity */
    readonly LOW_SEVERITY_RESOURCE_COUNT: 2;
};
/**
 * Severity priority for determining highest severity
 * Higher number = higher priority
 */
export declare const SEVERITY_PRIORITY: Record<CrisisSeverity, number>;
