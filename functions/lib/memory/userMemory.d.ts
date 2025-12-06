/**
 * Memory Layer - Core CRUD Operations
 *
 * Manages user-specific learnings that persist across sessions.
 * Memories have confidence scores that decay over time without reinforcement.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
import { Memory, MemoryType, MemoryCreateInput, MemoryUpdateInput, MemoryRetrievalContext, ScoredMemory } from './types';
/**
 * Store a new memory or update existing one if duplicate found
 *
 * Deduplication: If a memory with same user_id, type, and similar content exists,
 * the existing memory is reinforced (confidence boosted, evidence_count incremented)
 */
export declare function storeMemory(input: MemoryCreateInput): Promise<Memory>;
/**
 * Reinforce an existing memory - boost confidence and increment evidence
 * Called when the same pattern is observed again
 */
export declare function reinforceMemory(memoryId: string, newContext?: string): Promise<Memory>;
/**
 * Get memories relevant to the current context
 * Used by nudge engine to personalize recommendations
 */
export declare function getRelevantMemories(userId: string, context: MemoryRetrievalContext, limit?: number): Promise<ScoredMemory[]>;
/**
 * Get all memories for a user (for data export/GDPR)
 */
export declare function getAllUserMemories(userId: string): Promise<Memory[]>;
/**
 * Update a specific memory
 */
export declare function updateMemory(memoryId: string, updates: MemoryUpdateInput): Promise<Memory>;
/**
 * Delete a specific memory
 */
export declare function deleteMemory(memoryId: string): Promise<void>;
/**
 * Delete all memories for a user (for GDPR deletion requests)
 */
export declare function deleteAllUserMemories(userId: string): Promise<number>;
/**
 * Apply memory decay for a specific user
 * Called by daily scheduler job
 *
 * Uses the PostgreSQL function apply_memory_decay() for efficiency
 */
export declare function applyMemoryDecay(userId?: string): Promise<number>;
/**
 * Prune memories for a user - remove expired, low-confidence, and enforce max limit
 * Called by daily scheduler job
 *
 * Uses the PostgreSQL function prune_user_memories() for efficiency
 */
export declare function pruneMemories(userId: string): Promise<number>;
/**
 * Get memory statistics for a user
 * Useful for debugging and analytics
 */
export declare function getMemoryStats(userId: string): Promise<{
    total: number;
    byType: Record<MemoryType, number>;
    avgConfidence: number;
    oldestMemory: string | null;
    newestMemory: string | null;
}>;
/**
 * Create memory from nudge feedback
 * Called by analyzeNudgeFeedback.ts when user responds to a nudge
 */
export declare function createFromNudgeFeedback(userId: string, nudgeId: string, protocolId: string, feedback: 'completed' | 'dismissed' | 'snoozed', context?: string): Promise<Memory>;
/**
 * Create memory from stated preference
 * Called when user explicitly states a preference in chat or settings
 */
export declare function createFromStatedPreference(userId: string, preference: string, isConstraint?: boolean, source?: string): Promise<Memory>;
/**
 * Create memory for protocol effectiveness
 * Called when analyzing which protocols work well for user
 */
export declare function createProtocolEffectivenessMemory(userId: string, protocolId: string, effectiveness: 'high' | 'medium' | 'low', context: string): Promise<Memory>;
