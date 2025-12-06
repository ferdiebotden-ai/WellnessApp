"use strict";
/**
 * Confidence Scorer
 *
 * Calculates multi-factor confidence scores for nudge recommendations.
 * Each factor is independently scored (0-1), then weighted to produce
 * an overall confidence. Scores < 0.4 trigger suppression.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Reasoning Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateConfidence = calculateConfidence;
exports.getTimeOfDay = getTimeOfDay;
const types_1 = require("./types");
/**
 * Calculate protocol_fit score (0.25 weight)
 *
 * How well does the protocol match the user's primary goal?
 * - Perfect match (protocol module aligns with goal): 1.0
 * - Keyword match (protocol name/benefits contain goal keywords): 0.7
 * - No match: 0.3
 */
function calculateProtocolFit(context) {
    const { primary_goal, module_id, protocol } = context;
    const optimalModules = types_1.GOAL_MODULE_MAPPING[primary_goal] || [];
    // Direct module match - highest score
    if (optimalModules.includes(module_id)) {
        return 1.0;
    }
    // Check if protocol name/benefits contain goal-relevant keywords
    const keywords = types_1.GOAL_KEYWORDS[primary_goal] || [];
    const protocolName = (protocol.name || '').toLowerCase();
    const protocolBenefits = (protocol.benefits || '').toLowerCase();
    const protocolDescription = (protocol.description || '').toLowerCase();
    const hasKeywordMatch = keywords.some((kw) => protocolName.includes(kw) ||
        protocolBenefits.includes(kw) ||
        protocolDescription.includes(kw));
    if (hasKeywordMatch) {
        return 0.7;
    }
    // Base score for any active protocol
    return 0.3;
}
/**
 * Calculate memory_support score (0.25 weight)
 *
 * How many positive memories support this recommendation?
 * - High-confidence positive feedback memories: strong boost
 * - Negative feedback (dismissed nudges): penalty
 * - Protocol effectiveness memories: direct impact
 */
function calculateMemorySupport(context) {
    const { memories, protocol } = context;
    if (memories.length === 0) {
        return 0.5; // Neutral when no memories exist
    }
    let positiveSignals = 0;
    let negativeSignals = 0;
    let totalWeight = 0;
    for (const memory of memories) {
        const weight = memory.confidence * memory.relevance_score;
        totalWeight += weight;
        const content = memory.content.toLowerCase();
        const protocolName = (protocol.name || '').toLowerCase();
        // Check if memory is specifically about this protocol
        const isProtocolRelated = memory.source_protocol_id === protocol.id ||
            content.includes(protocol.id) ||
            content.includes(protocolName);
        // Protocol-relevant memories weighted higher
        const relevanceMultiplier = isProtocolRelated ? 2.0 : 1.0;
        switch (memory.type) {
            case 'protocol_effectiveness':
                if (content.includes('high effectiveness') || content.includes('works well')) {
                    positiveSignals += weight * relevanceMultiplier * 1.5;
                }
                else if (content.includes('low effectiveness') || content.includes('not effective')) {
                    negativeSignals += weight * relevanceMultiplier * 1.5;
                }
                else {
                    positiveSignals += weight * relevanceMultiplier * 0.5;
                }
                break;
            case 'nudge_feedback':
                if (content.includes('completed')) {
                    positiveSignals += weight * relevanceMultiplier;
                }
                else if (content.includes('dismissed')) {
                    negativeSignals += weight * relevanceMultiplier * 1.2;
                }
                else if (content.includes('snoozed')) {
                    // Snoozed is mildly negative
                    negativeSignals += weight * relevanceMultiplier * 0.3;
                }
                break;
            case 'stated_preference':
                // Stated preferences are high-value signals
                if (content.includes('like') || content.includes('prefer') || content.includes('love')) {
                    positiveSignals += weight * relevanceMultiplier * 1.5;
                }
                else if (content.includes('hate') || content.includes('dislike') || content.includes('avoid')) {
                    negativeSignals += weight * relevanceMultiplier * 2.0;
                }
                break;
            case 'preference_constraint':
                // Constraints are blockers - heavy penalty if protocol conflicts
                if (isProtocolRelated) {
                    negativeSignals += weight * 3.0;
                }
                break;
            case 'preferred_time':
                // Time preferences are lighter signals
                positiveSignals += weight * 0.3;
                break;
            case 'pattern_detected':
                // AI-detected patterns are lowest confidence
                positiveSignals += weight * 0.2;
                break;
        }
    }
    // Calculate net sentiment
    if (totalWeight === 0) {
        return 0.5;
    }
    const netScore = (positiveSignals - negativeSignals) / (totalWeight + 1);
    // Normalize to 0-1 range (netScore can be negative)
    // Map from [-1, 1] to [0.1, 0.9] to avoid extreme scores
    const normalized = 0.5 + netScore * 0.4;
    return Math.max(0.1, Math.min(0.9, normalized));
}
/**
 * Calculate timing_fit score (0.20 weight)
 *
 * Is this the right time for this protocol?
 * - Morning protocols in morning: high
 * - Evening protocols at night: high
 * - Recovery protocols when HRV is low: high
 */
function calculateTimingFit(context) {
    const { time_of_day, protocol, recovery_score } = context;
    let score = 0.5; // Base score
    // Check category-time alignment
    const category = protocol.category || 'Optimization';
    const optimalTimes = types_1.CATEGORY_TIME_MAPPING[category] || ['morning', 'afternoon', 'evening'];
    if (optimalTimes.includes(time_of_day)) {
        score += 0.25;
    }
    else {
        score -= 0.15;
    }
    // Protocol name analysis for timing cues
    const name = (protocol.name || '').toLowerCase();
    if (time_of_day === 'morning') {
        if (name.includes('morning') || name.includes('light') || name.includes('caffeine')) {
            score += 0.2;
        }
        if (name.includes('evening') || name.includes('sleep')) {
            score -= 0.2;
        }
    }
    if (time_of_day === 'evening' || time_of_day === 'night') {
        if (name.includes('evening') || name.includes('sleep') || name.includes('nsdr')) {
            score += 0.2;
        }
        if (name.includes('morning') || name.includes('caffeine')) {
            score -= 0.3; // Caffeine at night is a bigger penalty
        }
    }
    // Recovery-aware timing
    if (recovery_score !== undefined) {
        const isRecoveryProtocol = category === 'Recovery' ||
            name.includes('nsdr') ||
            name.includes('breathing') ||
            name.includes('recovery');
        if (recovery_score < 40) {
            // Low recovery - boost recovery protocols, reduce intensity protocols
            if (isRecoveryProtocol) {
                score += 0.15;
            }
            if (category === 'Performance' && name.includes('fitness')) {
                score -= 0.2;
            }
        }
        else if (recovery_score > 70) {
            // High recovery - performance protocols are more appropriate
            if (category === 'Performance') {
                score += 0.1;
            }
        }
    }
    return Math.max(0, Math.min(1, score));
}
/**
 * Calculate conflict_risk score (0.15 weight)
 *
 * Does this protocol conflict with other recommendations or user constraints?
 * Higher score = lower conflict risk (inverse relationship)
 */
function calculateConflictRisk(context) {
    const { protocol, memories, other_protocols = [] } = context;
    let conflictPenalty = 0;
    // Check for constraint conflicts from memories
    const constraintMemories = memories.filter((m) => m.type === 'preference_constraint');
    for (const constraint of constraintMemories) {
        const content = constraint.content.toLowerCase();
        const protocolName = (protocol.name || '').toLowerCase();
        // Check if user constraint matches protocol
        if (content.includes('no gym') && protocolName.includes('gym')) {
            conflictPenalty += 0.4;
        }
        if (content.includes('cold') && content.includes('can\'t') && protocolName.includes('cold')) {
            conflictPenalty += 0.4;
        }
        if (content.includes('no caffeine') && protocolName.includes('caffeine')) {
            conflictPenalty += 0.4;
        }
        if (content.includes('no supplement') && protocolName.includes('supplement')) {
            conflictPenalty += 0.3;
        }
    }
    // Check for conflicts with other protocols in the same batch
    for (const other of other_protocols) {
        if (other.id === protocol.id)
            continue;
        const thisCategory = protocol.category || '';
        const otherCategory = other.category || '';
        // Avoid recommending too many of the same category
        if (thisCategory === otherCategory) {
            conflictPenalty += 0.1;
        }
        // Specific conflict checks
        const thisName = (protocol.name || '').toLowerCase();
        const otherName = (other.name || '').toLowerCase();
        // Caffeine + Sleep protocols conflict
        if ((thisName.includes('caffeine') && otherName.includes('sleep')) ||
            (thisName.includes('sleep') && otherName.includes('caffeine'))) {
            conflictPenalty += 0.3;
        }
        // Cold exposure + Heavy exercise on same day (timing matters)
        if ((thisName.includes('cold') && otherName.includes('fitness')) ||
            (thisName.includes('fitness') && otherName.includes('cold'))) {
            conflictPenalty += 0.15;
        }
    }
    // Invert: higher penalty = lower score
    const score = Math.max(0.1, 1.0 - conflictPenalty);
    return score;
}
/**
 * Calculate evidence_strength score (0.15 weight)
 *
 * How strong is the scientific evidence for this protocol?
 */
function calculateEvidenceStrength(context) {
    const { protocol } = context;
    // Get evidence level from protocol metadata
    const evidenceLevel = protocol
        .evidence_level;
    if (evidenceLevel && types_1.EVIDENCE_SCORES[evidenceLevel] !== undefined) {
        return types_1.EVIDENCE_SCORES[evidenceLevel];
    }
    // Default to 'High' if not specified (most protocols in the library are High)
    return types_1.EVIDENCE_SCORES['High'];
}
/**
 * Generate human-readable reasoning string
 */
function generateReasoning(factors, overall, context) {
    const parts = [];
    // Overall assessment
    if (overall >= 0.7) {
        parts.push(`High confidence (${(overall * 100).toFixed(0)}%).`);
    }
    else if (overall >= 0.5) {
        parts.push(`Moderate confidence (${(overall * 100).toFixed(0)}%).`);
    }
    else if (overall >= types_1.CONFIDENCE_SUPPRESSION_THRESHOLD) {
        parts.push(`Low confidence (${(overall * 100).toFixed(0)}%).`);
    }
    else {
        parts.push(`Below threshold - suppressed (${(overall * 100).toFixed(0)}%).`);
    }
    // Factor-specific reasoning
    const factorDescriptions = [];
    // Protocol fit
    if (factors.protocol_fit >= 0.8) {
        factorDescriptions.push('strong goal alignment');
    }
    else if (factors.protocol_fit < 0.4) {
        factorDescriptions.push('weak goal alignment');
    }
    // Memory support
    if (factors.memory_support >= 0.7) {
        factorDescriptions.push('positive past feedback');
    }
    else if (factors.memory_support < 0.4) {
        factorDescriptions.push('negative past feedback');
    }
    // Timing
    if (factors.timing_fit >= 0.7) {
        factorDescriptions.push('optimal timing');
    }
    else if (factors.timing_fit < 0.4) {
        factorDescriptions.push('suboptimal timing');
    }
    // Conflict
    if (factors.conflict_risk < 0.5) {
        factorDescriptions.push('potential conflicts');
    }
    // Evidence
    if (factors.evidence_strength >= 0.9) {
        factorDescriptions.push('very high evidence');
    }
    if (factorDescriptions.length > 0) {
        parts.push(`Factors: ${factorDescriptions.join(', ')}.`);
    }
    // Protocol context
    if (context.protocol.name) {
        parts.push(`Protocol: ${context.protocol.name}.`);
    }
    // Memory context
    if (context.memories.length > 0) {
        parts.push(`Based on ${context.memories.length} relevant memories.`);
    }
    return parts.join(' ');
}
/**
 * Calculate overall confidence score for a nudge recommendation
 *
 * @param context - All context needed for scoring
 * @returns ConfidenceScore with overall, factors, suppression flag, and reasoning
 */
function calculateConfidence(context) {
    // Calculate each factor
    const factors = {
        protocol_fit: calculateProtocolFit(context),
        memory_support: calculateMemorySupport(context),
        timing_fit: calculateTimingFit(context),
        conflict_risk: calculateConflictRisk(context),
        evidence_strength: calculateEvidenceStrength(context),
    };
    // Calculate weighted sum
    let overall = 0;
    for (const [factor, weight] of Object.entries(types_1.CONFIDENCE_WEIGHTS)) {
        overall += factors[factor] * weight;
    }
    // Round to 2 decimal places
    overall = Math.round(overall * 100) / 100;
    // Determine suppression
    const should_suppress = overall < types_1.CONFIDENCE_SUPPRESSION_THRESHOLD;
    // Generate reasoning
    const reasoning = generateReasoning(factors, overall, context);
    return {
        overall,
        factors,
        should_suppress,
        reasoning,
    };
}
/**
 * Helper to determine time of day from hour
 *
 * @param hour - Hour in 24h format (0-23)
 * @returns TimeOfDay category
 */
function getTimeOfDay(hour) {
    if (hour >= 5 && hour < 12)
        return 'morning';
    if (hour >= 12 && hour < 17)
        return 'afternoon';
    if (hour >= 17 && hour < 21)
        return 'evening';
    return 'night';
}
