"use strict";
/**
 * Crisis Detection Engine
 *
 * Detects crisis indicators in user input with contextual awareness
 * and surfaces appropriate mental health resources.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.hasExclusionMatch = hasExclusionMatch;
exports.findMatchingKeywords = findMatchingKeywords;
exports.detectCrisis = detectCrisis;
exports.generateCrisisResponse = generateCrisisResponse;
exports.requiresImmediateIntervention = requiresImmediateIntervention;
exports.getSeverityDescription = getSeverityDescription;
const types_1 = require("./types");
const crisisRules_1 = require("./crisisRules");
/**
 * Normalize text for consistent matching.
 * Converts to lowercase, normalizes whitespace, and handles apostrophes.
 *
 * @param text - Raw input text
 * @returns Normalized text for matching
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/['`]/g, "'") // Normalize apostrophes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}
/**
 * Check if any exclusion pattern matches the text.
 * An exclusion match means the keyword is being used in a benign context.
 *
 * @param text - Normalized text to check
 * @param exclusions - Array of exclusion patterns
 * @returns True if any exclusion matches
 */
function hasExclusionMatch(text, exclusions) {
    if (!exclusions || exclusions.length === 0) {
        return false;
    }
    return exclusions.some((exclusion) => text.includes(exclusion.toLowerCase()));
}
/**
 * Find all matching crisis keywords in the text.
 *
 * @param text - Normalized text to scan
 * @returns Array of matched CrisisKeyword objects
 */
function findMatchingKeywords(text) {
    const matches = [];
    for (const keyword of crisisRules_1.CRISIS_KEYWORDS) {
        // Check if the keyword phrase is present
        if (text.includes(keyword.phrase)) {
            // Check if any exclusion pattern negates this match
            if (!hasExclusionMatch(text, keyword.exclusions || [])) {
                matches.push(keyword);
            }
        }
    }
    return matches;
}
/**
 * Detect crisis indicators in user input.
 *
 * This function:
 * 1. Normalizes the input text
 * 2. Scans for crisis keywords while respecting exclusions
 * 3. Determines the highest severity level
 * 4. Returns appropriate crisis resources
 *
 * @param text - User input to analyze
 * @returns CrisisDetectionResult with detection status and resources
 */
function detectCrisis(text) {
    // Handle empty or invalid input
    if (!text || typeof text !== 'string') {
        return {
            detected: false,
            severity: null,
            matchedKeywords: [],
            resources: [],
            shouldLog: false,
        };
    }
    // Truncate long inputs for performance
    const truncatedText = text.slice(0, types_1.SAFETY_CONFIG.MAX_SCAN_LENGTH);
    const normalizedText = normalizeText(truncatedText);
    // Find all matching keywords
    const matchedKeywordObjects = findMatchingKeywords(normalizedText);
    // If no matches, return early
    if (matchedKeywordObjects.length === 0) {
        return {
            detected: false,
            severity: null,
            matchedKeywords: [],
            resources: [],
            shouldLog: types_1.SAFETY_CONFIG.LOG_ALL_SCANS,
        };
    }
    // Get the highest severity
    const severities = matchedKeywordObjects.map((k) => k.severity);
    const highestSeverity = (0, crisisRules_1.getHighestSeverity)(severities);
    // Get appropriate resources based on severity
    let resourceLimit;
    switch (highestSeverity) {
        case 'high':
            resourceLimit = types_1.SAFETY_CONFIG.HIGH_SEVERITY_RESOURCE_COUNT;
            break;
        case 'medium':
            resourceLimit = types_1.SAFETY_CONFIG.MEDIUM_SEVERITY_RESOURCE_COUNT;
            break;
        default:
            resourceLimit = types_1.SAFETY_CONFIG.LOW_SEVERITY_RESOURCE_COUNT;
    }
    const resources = highestSeverity
        ? (0, crisisRules_1.getResourcesForSeverity)(highestSeverity, resourceLimit)
        : [];
    return {
        detected: true,
        severity: highestSeverity,
        matchedKeywords: matchedKeywordObjects.map((k) => k.phrase),
        resources,
        shouldLog: true,
    };
}
/**
 * Generate a compassionate crisis response message with resources.
 *
 * @param result - CrisisDetectionResult from detectCrisis
 * @returns Formatted response string with resources
 */
function generateCrisisResponse(result) {
    if (!result.detected || result.resources.length === 0) {
        return "I'm here to help with wellness guidance. How can I assist you today?";
    }
    let message;
    switch (result.severity) {
        case 'high':
            message =
                "I'm concerned about what you're sharing. Your safety matters, and I want to make sure you have the support you need right now. Please reach out to one of these resources:";
            break;
        case 'medium':
            message =
                "I hear that you're going through something difficult. You don't have to face this alone. Here are some resources that can help:";
            break;
        case 'low':
            message =
                "I understand this can be challenging. There are people who specialize in supporting you through this. Here are some helpful resources:";
            break;
        default:
            message = "Here are some resources that may help:";
    }
    // Format resources
    const resourceList = result.resources
        .map((r) => `\n\n**${r.name}**\n${r.description}\n${r.contact}`)
        .join('');
    const footer = "\n\nRemember: reaching out for help is a sign of strength, not weakness. These services are free, confidential, and available 24/7.";
    return message + resourceList + footer;
}
/**
 * Determine if crisis requires immediate intervention.
 * When true, normal AI response should be deferred entirely.
 *
 * @param result - CrisisDetectionResult from detectCrisis
 * @returns True if AI should not provide normal response
 */
function requiresImmediateIntervention(result) {
    if (!result.detected) {
        return false;
    }
    // High and medium severity require intervention
    return result.severity === 'high' || result.severity === 'medium';
}
/**
 * Get severity description for audit logging.
 *
 * @param severity - CrisisSeverity or null
 * @returns Human-readable severity description
 */
function getSeverityDescription(severity) {
    switch (severity) {
        case 'high':
            return 'Immediate risk - suicide/overdose indicators';
        case 'medium':
            return 'Self-harm indicators';
        case 'low':
            return 'Eating disorder indicators';
        default:
            return 'No crisis detected';
    }
}
