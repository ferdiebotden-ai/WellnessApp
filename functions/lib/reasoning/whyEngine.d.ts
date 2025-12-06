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
import { ScoredMemory } from '../memory';
import { ProtocolSearchResult } from '../protocolSearch';
import { ConfidenceScore, EvidenceLevel } from './types';
/**
 * Confidence level for UI display
 */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
/**
 * Structured reasoning content for a nudge
 * Displayed in the "Why?" expansion panel
 */
export interface WhyExpansion {
    /** 1-2 sentences explaining how the protocol works physiologically */
    mechanism: string;
    /** Citation with DOI link and evidence strength */
    evidence: {
        /** Full citation text from protocol */
        citation: string;
        /** Parsed DOI link (if available) */
        doi?: string;
        /** Evidence strength level */
        strength: EvidenceLevel;
    };
    /** Personalized insight based on user's data (max 150 chars) */
    your_data: string;
    /** Confidence assessment */
    confidence: {
        /** Mapped level for UI display */
        level: ConfidenceLevel;
        /** Human-readable explanation */
        explanation: string;
    };
}
/**
 * Input parameters for WhyExpansion generation
 */
export interface WhyExpansionParams {
    /** Protocol being recommended */
    protocol: ProtocolSearchResult;
    /** Calculated confidence score */
    confidence: ConfidenceScore;
    /** User's relevant memories */
    memories: ScoredMemory[];
    /** User ID for context */
    userId: string;
}
/**
 * Extract first 1-2 sentences from protocol description as mechanism
 * @param description Full protocol description
 * @returns First 2 sentences, max 250 chars
 */
export declare function extractMechanism(description: string | null): string;
/**
 * Parse DOI from citation string
 * DOI format: 10.XXXX/... (e.g., 10.1016/j.cub.2013.06.039)
 * @param citation Full citation text
 * @returns DOI string or undefined if not found
 */
export declare function parseDOI(citation: string): string | undefined;
/**
 * Map numerical confidence score to display level
 * @param score Overall confidence (0-1)
 * @returns 'High' | 'Medium' | 'Low'
 */
export declare function mapConfidenceLevel(score: number): ConfidenceLevel;
/**
 * Generate confidence explanation based on score and factors
 * @param confidence Complete confidence score
 * @param memoriesCount Number of memories used
 * @returns Human-readable explanation
 */
export declare function generateConfidenceExplanation(confidence: ConfidenceScore, memoriesCount: number): string;
/**
 * Generate personalized "Your Data" insight using AI
 * @param protocol The recommended protocol
 * @param memories User's relevant memories
 * @param confidence Confidence factors
 * @returns Personalized sentence under 150 chars
 */
export declare function generateYourData(protocol: ProtocolSearchResult, memories: ScoredMemory[], confidence: ConfidenceScore): Promise<string>;
/**
 * Generate complete WhyExpansion for a nudge
 * Main orchestration function that calls all sub-functions
 *
 * @param params Protocol, confidence, memories, and userId
 * @returns Complete WhyExpansion object
 */
export declare function generateWhyExpansion(params: WhyExpansionParams): Promise<WhyExpansion>;
