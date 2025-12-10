/**
 * Personalized Protocol Endpoint
 *
 * Returns enriched protocol data with user-specific personalization:
 * - Full protocol details (mechanism, parameters, study sources)
 * - User's relationship with the protocol (adherence, last completed)
 * - Calculated confidence score from 5-factor system
 *
 * Session 59: Protocol Data Enrichment & Personalization
 */
import { Request, Response } from 'express';
import type { ConfidenceFactors } from './reasoning/types';
interface ParameterRange {
    min: number;
    optimal: number;
    max: number;
    unit: string;
}
interface StudySource {
    author: string;
    year: number;
    title?: string;
    doi?: string;
    journal?: string;
}
interface SuccessMetric {
    metric: string;
    baseline: string;
    target: string;
    timeline: string;
}
interface ImplementationMethod {
    id: string;
    name: string;
    description: string;
    icon?: string;
}
interface EnrichedProtocol {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    tier_required: string | null;
    benefits: string | null;
    constraints: string | null;
    citations: string[];
    mechanism_description: string | null;
    duration_minutes: number | null;
    frequency_per_week: number | null;
    parameter_ranges: Record<string, ParameterRange>;
    implementation_rules: Record<string, string>;
    success_metrics: SuccessMetric[];
    study_sources: StudySource[];
    implementation_methods: ImplementationMethod[];
}
interface UserProtocolData {
    last_completed_at: string | null;
    adherence_7d: number;
    difficulty_avg: number | null;
    total_completions: number;
    memory_insight: string | null;
}
interface ConfidenceResult {
    level: 'high' | 'medium' | 'low';
    overall: number;
    factors: ConfidenceFactors;
    reasoning: string;
}
export interface PersonalizedProtocolResponse {
    protocol: EnrichedProtocol;
    user_data: UserProtocolData;
    confidence: ConfidenceResult;
}
/**
 * GET /api/protocols/:id/personalized
 *
 * Returns enriched protocol with user-specific personalization data
 */
export declare function getPersonalizedProtocol(req: Request, res: Response): Promise<void>;
export {};
