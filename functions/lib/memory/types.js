"use strict";
/**
 * Memory Layer Type Definitions
 *
 * The Memory Layer stores user-specific learnings that persist across sessions.
 * Each memory has a confidence score that decays over time without reinforcement.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EXPIRATION_DAYS = exports.MEMORY_TYPE_PRIORITY = exports.MEMORY_CONFIG = void 0;
/**
 * Memory layer configuration constants
 */
exports.MEMORY_CONFIG = {
    MAX_MEMORIES_PER_USER: 150,
    MIN_CONFIDENCE_THRESHOLD: 0.1,
    DEFAULT_CONFIDENCE: 0.5,
    DEFAULT_DECAY_RATE: 0.05,
    MIN_DECAY_RATE: 0.01,
    MAX_DECAY_RATE: 0.1,
    HIGH_EVIDENCE_DECAY_REDUCTION: 0.5, // Reduce decay by 50% for high-evidence memories
    HIGH_EVIDENCE_THRESHOLD: 5 // Memories with 5+ evidence points get reduced decay
};
/**
 * Memory type priorities for context matching
 * Higher priority memories are retrieved first when limit is applied
 */
exports.MEMORY_TYPE_PRIORITY = {
    'stated_preference': 1, // Explicit user statements are highest priority
    'preference_constraint': 2, // Constraints are critical to respect
    'protocol_effectiveness': 3, // Protocol-specific learnings
    'preferred_time': 4, // Time preferences
    'nudge_feedback': 5, // Behavioral feedback
    'pattern_detected': 6 // AI patterns are lowest (need validation)
};
/**
 * Default expiration times by memory type (in days)
 * null means no automatic expiration
 */
exports.DEFAULT_EXPIRATION_DAYS = {
    'stated_preference': null, // Never expire explicit statements
    'preference_constraint': null, // Never expire constraints
    'protocol_effectiveness': 90, // Re-evaluate every 90 days
    'preferred_time': 60, // Time preferences may change
    'nudge_feedback': 30, // Short-term feedback patterns
    'pattern_detected': 45 // Patterns need regular validation
};
