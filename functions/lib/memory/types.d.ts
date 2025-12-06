/**
 * Memory Layer Type Definitions
 *
 * The Memory Layer stores user-specific learnings that persist across sessions.
 * Each memory has a confidence score that decays over time without reinforcement.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
/**
 * The 6 memory types that capture different aspects of user behavior and preferences.
 * Maps directly to PostgreSQL enum `memory_type` in user_memories table.
 */
export type MemoryType = 'nudge_feedback' | 'protocol_effectiveness' | 'preferred_time' | 'stated_preference' | 'pattern_detected' | 'preference_constraint';
/**
 * Memory record as stored in Supabase user_memories table
 */
export interface Memory {
    id: string;
    user_id: string;
    type: MemoryType;
    content: string;
    context?: string;
    confidence: number;
    evidence_count: number;
    decay_rate: number;
    created_at: string;
    last_used_at: string;
    last_decayed_at: string;
    expires_at?: string;
    source_nudge_id?: string;
    source_protocol_id?: string;
    metadata: Record<string, unknown>;
}
/**
 * Input for creating a new memory
 */
export interface MemoryCreateInput {
    user_id: string;
    type: MemoryType;
    content: string;
    context?: string;
    confidence?: number;
    decay_rate?: number;
    source_nudge_id?: string;
    source_protocol_id?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Input for updating an existing memory
 */
export interface MemoryUpdateInput {
    content?: string;
    context?: string;
    confidence?: number;
    evidence_count?: number;
    decay_rate?: number;
    metadata?: Record<string, unknown>;
}
/**
 * Context for retrieving relevant memories
 */
export interface MemoryRetrievalContext {
    protocol_id?: string;
    module_id?: string;
    memory_types?: MemoryType[];
    min_confidence?: number;
    time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
}
/**
 * Result of memory retrieval with scoring
 */
export interface ScoredMemory extends Memory {
    relevance_score: number;
}
/**
 * Memory layer configuration constants
 */
export declare const MEMORY_CONFIG: {
    readonly MAX_MEMORIES_PER_USER: 150;
    readonly MIN_CONFIDENCE_THRESHOLD: 0.1;
    readonly DEFAULT_CONFIDENCE: 0.5;
    readonly DEFAULT_DECAY_RATE: 0.05;
    readonly MIN_DECAY_RATE: 0.01;
    readonly MAX_DECAY_RATE: 0.1;
    readonly HIGH_EVIDENCE_DECAY_REDUCTION: 0.5;
    readonly HIGH_EVIDENCE_THRESHOLD: 5;
};
/**
 * Memory type priorities for context matching
 * Higher priority memories are retrieved first when limit is applied
 */
export declare const MEMORY_TYPE_PRIORITY: Record<MemoryType, number>;
/**
 * Default expiration times by memory type (in days)
 * null means no automatic expiration
 */
export declare const DEFAULT_EXPIRATION_DAYS: Record<MemoryType, number | null>;
