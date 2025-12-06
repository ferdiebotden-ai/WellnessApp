"use strict";
/**
 * Safety Module Types
 *
 * Type definitions for crisis detection and AI output safety scanning.
 * Follows patterns established in suppression/types.ts and memory/types.ts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEVERITY_PRIORITY = exports.SAFETY_CONFIG = void 0;
/**
 * Safety module configuration constants
 */
exports.SAFETY_CONFIG = {
    /** Maximum characters to scan (performance limit) */
    MAX_SCAN_LENGTH: 5000,
    /** Log all scans (including non-detections) for debugging */
    LOG_ALL_SCANS: false,
    /** Number of resources to show for high severity */
    HIGH_SEVERITY_RESOURCE_COUNT: 4,
    /** Number of resources to show for medium severity */
    MEDIUM_SEVERITY_RESOURCE_COUNT: 3,
    /** Number of resources to show for low severity */
    LOW_SEVERITY_RESOURCE_COUNT: 2,
};
/**
 * Severity priority for determining highest severity
 * Higher number = higher priority
 */
exports.SEVERITY_PRIORITY = {
    low: 1,
    medium: 2,
    high: 3,
};
