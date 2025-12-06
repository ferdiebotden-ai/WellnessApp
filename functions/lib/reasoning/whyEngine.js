"use strict";
/**
 * Why Engine: Generates structured reasoning content for nudges
 *
 * Provides the "Why?" expansion feature that shows users:
 * - Mechanism: How the protocol works physiologically
 * - Evidence: Citation with DOI link and strength
 * - Your Data: Personalized insight from user's patterns
 * - Confidence: Level and explanation
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Session 12
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMechanism = extractMechanism;
exports.parseDOI = parseDOI;
exports.mapConfidenceLevel = mapConfidenceLevel;
exports.generateConfidenceExplanation = generateConfidenceExplanation;
exports.generateYourData = generateYourData;
exports.generateWhyExpansion = generateWhyExpansion;
const vertexAI_1 = require("../vertexAI");
const types_1 = require("./types");
/**
 * Extract first 1-2 sentences from protocol description as mechanism
 * @param description Full protocol description
 * @returns First 2 sentences, max 250 chars
 */
function extractMechanism(description) {
    if (!description) {
        return 'This protocol supports your wellness goals through evidence-based practices.';
    }
    // Split by sentence-ending punctuation
    const sentences = description.split(/(?<=[.!?])\s+/);
    // Take first 2 sentences
    const mechanism = sentences.slice(0, 2).join(' ').trim();
    // Truncate to 250 chars if needed
    if (mechanism.length > 250) {
        return mechanism.substring(0, 247) + '...';
    }
    return mechanism;
}
/**
 * Parse DOI from citation string
 * DOI format: 10.XXXX/... (e.g., 10.1016/j.cub.2013.06.039)
 * @param citation Full citation text
 * @returns DOI string or undefined if not found
 */
function parseDOI(citation) {
    if (!citation)
        return undefined;
    // DOI regex: 10.XXXX/anything until whitespace
    const doiRegex = /\b10\.\d{4,}\/[^\s]+\b/;
    const match = citation.match(doiRegex);
    if (match) {
        // Clean trailing punctuation that might be captured
        return match[0].replace(/[.,;:)]$/, '');
    }
    return undefined;
}
/**
 * Map numerical confidence score to display level
 * @param score Overall confidence (0-1)
 * @returns 'High' | 'Medium' | 'Low'
 */
function mapConfidenceLevel(score) {
    if (score > 0.7)
        return 'High';
    if (score >= 0.4)
        return 'Medium';
    return 'Low';
}
/**
 * Generate confidence explanation based on score and factors
 * @param confidence Complete confidence score
 * @param memoriesCount Number of memories used
 * @returns Human-readable explanation
 */
function generateConfidenceExplanation(confidence, memoriesCount) {
    const level = mapConfidenceLevel(confidence.overall);
    const factors = confidence.factors;
    if (level === 'High') {
        if (memoriesCount >= 5) {
            return `Based on ${memoriesCount}+ patterns from your data`;
        }
        if (factors.evidence_strength >= 0.8) {
            return 'Strong research evidence supports this recommendation';
        }
        return 'High alignment with your goals and timing';
    }
    if (level === 'Medium') {
        if (memoriesCount > 0) {
            return `Based on ${memoriesCount} patterns we've observed`;
        }
        return 'Moderate evidence supports this for your current context';
    }
    // Low confidence
    return 'Limited data available - building your profile';
}
/**
 * Generate personalized "Your Data" insight using AI
 * @param protocol The recommended protocol
 * @param memories User's relevant memories
 * @param confidence Confidence factors
 * @returns Personalized sentence under 150 chars
 */
async function generateYourData(protocol, memories, confidence) {
    // If no memories, return generic but encouraging message
    if (memories.length === 0) {
        return 'We\'re learning your patterns to personalize this recommendation.';
    }
    const memoryContext = memories
        .slice(0, 5)
        .map((m) => `${m.type}: ${m.content}`)
        .join('; ');
    const prompt = `
Generate a single sentence (under 140 characters) personalizing this wellness recommendation:

Protocol: ${protocol.name || 'wellness protocol'}
User patterns: ${memoryContext}
Key factors: timing fit ${(confidence.factors.timing_fit * 100).toFixed(0)}%, protocol fit ${(confidence.factors.protocol_fit * 100).toFixed(0)}%

Rules:
- Reference specific patterns or numbers from the user data when available
- Be direct and data-driven
- No generic phrases like "based on your data"
- Output ONLY the sentence, no quotes

Example outputs:
"Your energy peaks 23% higher on days following this protocol."
"Sleep quality improved 18% when you practiced this consistently."
"Most effective for you between 6-8 AM based on 14 tracked days."
`;
    const systemPrompt = 'You are a wellness data analyst. Generate brief, specific, personalized insights. Never exceed 140 characters.';
    try {
        const result = await (0, vertexAI_1.generateCompletion)(systemPrompt, prompt, 0.5);
        // Clean and validate
        const cleaned = result.trim().replace(/^["']|["']$/g, '');
        // Enforce character limit
        if (cleaned.length > 150) {
            return cleaned.substring(0, 147) + '...';
        }
        return cleaned;
    }
    catch (error) {
        console.error('[WhyEngine] Failed to generate personalized insight:', error);
        // Fallback to generic message
        return `We've observed ${memories.length} patterns that support this recommendation.`;
    }
}
/**
 * Get evidence level from protocol, with fallback
 * Handles the case where evidence_level might not be in ProtocolSearchResult interface
 */
function getEvidenceLevel(protocol) {
    // Type assertion to access evidence_level if present
    const protocolWithEvidence = protocol;
    const level = protocolWithEvidence.evidence_level;
    // Validate it's a known evidence level
    if (level && types_1.EVIDENCE_SCORES[level] !== undefined) {
        return level;
    }
    // Default to 'Moderate' if not specified
    return 'Moderate';
}
/**
 * Generate complete WhyExpansion for a nudge
 * Main orchestration function that calls all sub-functions
 *
 * @param params Protocol, confidence, memories, and userId
 * @returns Complete WhyExpansion object
 */
async function generateWhyExpansion(params) {
    const { protocol, confidence, memories } = params;
    // Step 1: Extract mechanism from description
    const mechanism = extractMechanism(protocol.description);
    // Step 2: Get citation and parse DOI
    const citation = protocol.citations[0] || 'Evidence-based wellness protocol.';
    const doi = parseDOI(citation);
    const evidenceLevel = getEvidenceLevel(protocol);
    // Step 3: Generate personalized "Your Data"
    const yourData = await generateYourData(protocol, memories, confidence);
    // Step 4: Map confidence level and generate explanation
    const confidenceLevel = mapConfidenceLevel(confidence.overall);
    const confidenceExplanation = generateConfidenceExplanation(confidence, memories.length);
    return {
        mechanism,
        evidence: {
            citation,
            doi,
            strength: evidenceLevel,
        },
        your_data: yourData,
        confidence: {
            level: confidenceLevel,
            explanation: confidenceExplanation,
        },
    };
}
