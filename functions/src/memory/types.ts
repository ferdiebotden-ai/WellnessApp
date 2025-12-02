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
export type MemoryType =
  | 'nudge_feedback'         // How user responds to nudges (completed, dismissed, snoozed)
  | 'protocol_effectiveness' // Which protocols work well for this user
  | 'preferred_time'         // When user prefers certain activities
  | 'stated_preference'      // Explicit user preferences ("I hate cold exposure")
  | 'pattern_detected'       // AI-detected behavioral patterns
  | 'preference_constraint'; // Things user said they can't do ("no gym access")

/**
 * Memory record as stored in Supabase user_memories table
 */
export interface Memory {
  id: string;
  user_id: string;

  // Classification
  type: MemoryType;

  // Content
  content: string;      // The actual learning (e.g., "User prefers morning workouts")
  context?: string;     // What triggered this memory

  // Confidence and evidence
  confidence: number;   // 0-1 confidence score, decays over time
  evidence_count: number; // Number of data points supporting this

  // Decay configuration
  decay_rate: number;   // Weekly decay rate (0.01-0.1)

  // Lifecycle
  created_at: string;
  last_used_at: string;
  last_decayed_at: string;
  expires_at?: string;  // Optional hard expiration

  // Metadata
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
  confidence?: number;        // Default: 0.5
  decay_rate?: number;        // Default: 0.05 (5% weekly decay)
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
  protocol_id?: string;       // Get memories related to this protocol
  module_id?: string;         // Get memories related to this module
  memory_types?: MemoryType[]; // Filter by memory types
  min_confidence?: number;    // Minimum confidence threshold (default: 0.1)
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * Result of memory retrieval with scoring
 */
export interface ScoredMemory extends Memory {
  relevance_score: number;    // 0-1 how relevant this memory is to the context
}

/**
 * Memory layer configuration constants
 */
export const MEMORY_CONFIG = {
  MAX_MEMORIES_PER_USER: 150,
  MIN_CONFIDENCE_THRESHOLD: 0.1,
  DEFAULT_CONFIDENCE: 0.5,
  DEFAULT_DECAY_RATE: 0.05,
  MIN_DECAY_RATE: 0.01,
  MAX_DECAY_RATE: 0.1,
  HIGH_EVIDENCE_DECAY_REDUCTION: 0.5, // Reduce decay by 50% for high-evidence memories
  HIGH_EVIDENCE_THRESHOLD: 5          // Memories with 5+ evidence points get reduced decay
} as const;

/**
 * Memory type priorities for context matching
 * Higher priority memories are retrieved first when limit is applied
 */
export const MEMORY_TYPE_PRIORITY: Record<MemoryType, number> = {
  'stated_preference': 1,       // Explicit user statements are highest priority
  'preference_constraint': 2,   // Constraints are critical to respect
  'protocol_effectiveness': 3,  // Protocol-specific learnings
  'preferred_time': 4,          // Time preferences
  'nudge_feedback': 5,          // Behavioral feedback
  'pattern_detected': 6         // AI patterns are lowest (need validation)
};

/**
 * Default expiration times by memory type (in days)
 * null means no automatic expiration
 */
export const DEFAULT_EXPIRATION_DAYS: Record<MemoryType, number | null> = {
  'stated_preference': null,    // Never expire explicit statements
  'preference_constraint': null, // Never expire constraints
  'protocol_effectiveness': 90, // Re-evaluate every 90 days
  'preferred_time': 60,         // Time preferences may change
  'nudge_feedback': 30,         // Short-term feedback patterns
  'pattern_detected': 45        // Patterns need regular validation
};
