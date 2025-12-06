/**
 * Memory Layer Module
 *
 * Exports all Memory Layer functionality for use by other modules.
 *
 * Usage:
 *   import { storeMemory, getRelevantMemories } from './memory';
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
export { MemoryType, Memory, MemoryCreateInput, MemoryUpdateInput, MemoryRetrievalContext, ScoredMemory, MEMORY_CONFIG, MEMORY_TYPE_PRIORITY, DEFAULT_EXPIRATION_DAYS } from './types';
export { storeMemory, reinforceMemory, getRelevantMemories, getAllUserMemories, updateMemory, deleteMemory, deleteAllUserMemories } from './userMemory';
export { applyMemoryDecay, pruneMemories, getMemoryStats } from './userMemory';
export { createFromNudgeFeedback, createFromStatedPreference, createProtocolEffectivenessMemory } from './userMemory';
