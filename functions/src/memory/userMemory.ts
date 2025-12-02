/**
 * Memory Layer - Core CRUD Operations
 *
 * Manages user-specific learnings that persist across sessions.
 * Memories have confidence scores that decay over time without reinforcement.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */

import { getServiceClient } from '../supabaseClient';
import {
  Memory,
  MemoryType,
  MemoryCreateInput,
  MemoryUpdateInput,
  MemoryRetrievalContext,
  ScoredMemory,
  MEMORY_CONFIG,
  MEMORY_TYPE_PRIORITY,
  DEFAULT_EXPIRATION_DAYS
} from './types';

/**
 * Store a new memory or update existing one if duplicate found
 *
 * Deduplication: If a memory with same user_id, type, and similar content exists,
 * the existing memory is reinforced (confidence boosted, evidence_count incremented)
 */
export async function storeMemory(input: MemoryCreateInput): Promise<Memory> {
  const supabase = getServiceClient();

  // Check for existing similar memory
  const { data: existing } = await supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', input.user_id)
    .eq('type', input.type)
    .ilike('content', `%${input.content.substring(0, 50)}%`)
    .gte('confidence', MEMORY_CONFIG.MIN_CONFIDENCE_THRESHOLD)
    .limit(1)
    .maybeSingle();

  if (existing) {
    // Reinforce existing memory
    return reinforceMemory(existing.id, input.context);
  }

  // Calculate expiration if applicable
  const expirationDays = DEFAULT_EXPIRATION_DAYS[input.type];
  let expires_at: string | undefined;
  if (expirationDays !== null) {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expirationDays);
    expires_at = expDate.toISOString();
  }

  // Create new memory
  const { data, error } = await supabase
    .from('user_memories')
    .insert({
      user_id: input.user_id,
      type: input.type,
      content: input.content,
      context: input.context,
      confidence: input.confidence ?? MEMORY_CONFIG.DEFAULT_CONFIDENCE,
      evidence_count: 1,
      decay_rate: input.decay_rate ?? MEMORY_CONFIG.DEFAULT_DECAY_RATE,
      source_nudge_id: input.source_nudge_id,
      source_protocol_id: input.source_protocol_id,
      metadata: input.metadata ?? {},
      expires_at
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to store memory:', error);
    throw new Error(`Memory storage failed: ${error.message}`);
  }

  return data as Memory;
}

/**
 * Reinforce an existing memory - boost confidence and increment evidence
 * Called when the same pattern is observed again
 */
export async function reinforceMemory(
  memoryId: string,
  newContext?: string
): Promise<Memory> {
  const supabase = getServiceClient();

  // Get current memory
  const { data: current, error: fetchError } = await supabase
    .from('user_memories')
    .select('*')
    .eq('id', memoryId)
    .single();

  if (fetchError || !current) {
    throw new Error(`Memory not found: ${memoryId}`);
  }

  // Calculate new confidence (boost up to max 0.95)
  const confidenceBoost = 0.1 * (1 - current.confidence); // Diminishing returns
  const newConfidence = Math.min(0.95, current.confidence + confidenceBoost);

  // Reduce decay rate for high-evidence memories
  let newDecayRate = current.decay_rate;
  if (current.evidence_count + 1 >= MEMORY_CONFIG.HIGH_EVIDENCE_THRESHOLD) {
    newDecayRate = Math.max(
      MEMORY_CONFIG.MIN_DECAY_RATE,
      current.decay_rate * MEMORY_CONFIG.HIGH_EVIDENCE_DECAY_REDUCTION
    );
  }

  // Update memory
  const { data, error } = await supabase
    .from('user_memories')
    .update({
      confidence: newConfidence,
      evidence_count: current.evidence_count + 1,
      decay_rate: newDecayRate,
      last_used_at: new Date().toISOString(),
      context: newContext ?? current.context
    })
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Memory reinforcement failed: ${error.message}`);
  }

  return data as Memory;
}

/**
 * Get memories relevant to the current context
 * Used by nudge engine to personalize recommendations
 */
export async function getRelevantMemories(
  userId: string,
  context: MemoryRetrievalContext,
  limit: number = 10
): Promise<ScoredMemory[]> {
  const supabase = getServiceClient();

  // Build query
  let query = supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence', context.min_confidence ?? MEMORY_CONFIG.MIN_CONFIDENCE_THRESHOLD)
    .order('confidence', { ascending: false });

  // Filter by memory types if specified
  if (context.memory_types && context.memory_types.length > 0) {
    query = query.in('type', context.memory_types);
  }

  // Filter by protocol if specified
  if (context.protocol_id) {
    query = query.or(`source_protocol_id.eq.${context.protocol_id},source_protocol_id.is.null`);
  }

  // Filter out expired memories
  query = query.or('expires_at.is.null,expires_at.gt.now()');

  const { data, error } = await query.limit(limit * 2); // Fetch extra for scoring

  if (error) {
    console.error('Failed to retrieve memories:', error);
    return [];
  }

  // Score and sort memories
  const scored = (data as Memory[]).map(memory => ({
    ...memory,
    relevance_score: calculateRelevanceScore(memory, context)
  }));

  // Sort by relevance, then priority, then confidence
  scored.sort((a, b) => {
    // Primary: relevance score
    if (a.relevance_score !== b.relevance_score) {
      return b.relevance_score - a.relevance_score;
    }
    // Secondary: type priority
    const priorityA = MEMORY_TYPE_PRIORITY[a.type];
    const priorityB = MEMORY_TYPE_PRIORITY[b.type];
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // Tertiary: confidence
    return b.confidence - a.confidence;
  });

  return scored.slice(0, limit);
}

/**
 * Calculate relevance score for a memory given the current context
 */
function calculateRelevanceScore(memory: Memory, context: MemoryRetrievalContext): number {
  let score = memory.confidence;

  // Boost for protocol match
  if (context.protocol_id && memory.source_protocol_id === context.protocol_id) {
    score *= 1.5;
  }

  // Boost for time-of-day relevance
  if (context.time_of_day && memory.type === 'preferred_time') {
    const content = memory.content.toLowerCase();
    if (content.includes(context.time_of_day)) {
      score *= 1.3;
    }
  }

  // Boost for recently used memories
  const daysSinceUse = (Date.now() - new Date(memory.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUse < 7) {
    score *= 1.2;
  } else if (daysSinceUse > 30) {
    score *= 0.8;
  }

  // High-evidence memories get a boost
  if (memory.evidence_count >= MEMORY_CONFIG.HIGH_EVIDENCE_THRESHOLD) {
    score *= 1.1;
  }

  return Math.min(1, score); // Cap at 1
}

/**
 * Get all memories for a user (for data export/GDPR)
 */
export async function getAllUserMemories(userId: string): Promise<Memory[]> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user memories: ${error.message}`);
  }

  return data as Memory[];
}

/**
 * Update a specific memory
 */
export async function updateMemory(
  memoryId: string,
  updates: MemoryUpdateInput
): Promise<Memory> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('user_memories')
    .update({
      ...updates,
      last_used_at: new Date().toISOString()
    })
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    throw new Error(`Memory update failed: ${error.message}`);
  }

  return data as Memory;
}

/**
 * Delete a specific memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('user_memories')
    .delete()
    .eq('id', memoryId);

  if (error) {
    throw new Error(`Memory deletion failed: ${error.message}`);
  }
}

/**
 * Delete all memories for a user (for GDPR deletion requests)
 */
export async function deleteAllUserMemories(userId: string): Promise<number> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('user_memories')
    .delete()
    .eq('user_id', userId)
    .select('id');

  if (error) {
    throw new Error(`Bulk memory deletion failed: ${error.message}`);
  }

  return data?.length ?? 0;
}

/**
 * Apply memory decay for a specific user
 * Called by daily scheduler job
 *
 * Uses the PostgreSQL function apply_memory_decay() for efficiency
 */
export async function applyMemoryDecay(userId?: string): Promise<number> {
  const supabase = getServiceClient();

  if (userId) {
    // Decay for specific user using direct SQL
    // new_confidence = confidence * (1 - decay_rate)^weeks_since_last_decay
    const { data, error } = await supabase
      .from('user_memories')
      .update({
        last_decayed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .lt('last_decayed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select('id, confidence, decay_rate, last_decayed_at');

    if (error) {
      throw new Error(`Memory decay failed: ${error.message}`);
    }

    // Apply decay formula to each memory
    for (const memory of data || []) {
      const weeksSinceDecay = (Date.now() - new Date(memory.last_decayed_at).getTime()) /
        (7 * 24 * 60 * 60 * 1000);
      const newConfidence = Math.max(0, memory.confidence * Math.pow(1 - memory.decay_rate, weeksSinceDecay));

      await supabase
        .from('user_memories')
        .update({ confidence: newConfidence, last_decayed_at: new Date().toISOString() })
        .eq('id', memory.id);
    }

    return data?.length ?? 0;
  } else {
    // Use PostgreSQL function for global decay (more efficient)
    const { data, error } = await supabase.rpc('apply_memory_decay');

    if (error) {
      console.error('Memory decay RPC failed:', error);
      throw new Error(`Global memory decay failed: ${error.message}`);
    }

    return data as number;
  }
}

/**
 * Prune memories for a user - remove expired, low-confidence, and enforce max limit
 * Called by daily scheduler job
 *
 * Uses the PostgreSQL function prune_user_memories() for efficiency
 */
export async function pruneMemories(userId: string): Promise<number> {
  const supabase = getServiceClient();

  // Use PostgreSQL function for efficient pruning
  const { data, error } = await supabase.rpc('prune_user_memories', {
    target_user_id: userId
  });

  if (error) {
    console.error('Memory pruning RPC failed:', error);
    throw new Error(`Memory pruning failed: ${error.message}`);
  }

  return data as number;
}

/**
 * Get memory statistics for a user
 * Useful for debugging and analytics
 */
export async function getMemoryStats(userId: string): Promise<{
  total: number;
  byType: Record<MemoryType, number>;
  avgConfidence: number;
  oldestMemory: string | null;
  newestMemory: string | null;
}> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('user_memories')
    .select('type, confidence, created_at')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get memory stats: ${error.message}`);
  }

  const memories = data as Pick<Memory, 'type' | 'confidence' | 'created_at'>[];

  const byType: Record<string, number> = {};
  let totalConfidence = 0;
  let oldest: string | null = null;
  let newest: string | null = null;

  for (const memory of memories) {
    byType[memory.type] = (byType[memory.type] || 0) + 1;
    totalConfidence += memory.confidence;

    if (!oldest || memory.created_at < oldest) {
      oldest = memory.created_at;
    }
    if (!newest || memory.created_at > newest) {
      newest = memory.created_at;
    }
  }

  return {
    total: memories.length,
    byType: byType as Record<MemoryType, number>,
    avgConfidence: memories.length > 0 ? totalConfidence / memories.length : 0,
    oldestMemory: oldest,
    newestMemory: newest
  };
}

/**
 * Create memory from nudge feedback
 * Called by analyzeNudgeFeedback.ts when user responds to a nudge
 */
export async function createFromNudgeFeedback(
  userId: string,
  nudgeId: string,
  protocolId: string,
  feedback: 'completed' | 'dismissed' | 'snoozed',
  context?: string
): Promise<Memory> {
  const contentMap = {
    completed: `User completed nudge for protocol ${protocolId}`,
    dismissed: `User dismissed nudge for protocol ${protocolId}`,
    snoozed: `User snoozed nudge for protocol ${protocolId}`
  };

  const confidenceMap = {
    completed: 0.6,
    dismissed: 0.5,
    snoozed: 0.4
  };

  return storeMemory({
    user_id: userId,
    type: 'nudge_feedback',
    content: contentMap[feedback],
    context: context ?? `Feedback on nudge ${nudgeId}`,
    confidence: confidenceMap[feedback],
    source_nudge_id: nudgeId,
    source_protocol_id: protocolId
  });
}

/**
 * Create memory from stated preference
 * Called when user explicitly states a preference in chat or settings
 */
export async function createFromStatedPreference(
  userId: string,
  preference: string,
  isConstraint: boolean = false,
  source?: string
): Promise<Memory> {
  return storeMemory({
    user_id: userId,
    type: isConstraint ? 'preference_constraint' : 'stated_preference',
    content: preference,
    context: source ?? 'User stated preference',
    confidence: 0.9, // High confidence for explicit statements
    decay_rate: MEMORY_CONFIG.MIN_DECAY_RATE // Slow decay for stated preferences
  });
}

/**
 * Create memory for protocol effectiveness
 * Called when analyzing which protocols work well for user
 */
export async function createProtocolEffectivenessMemory(
  userId: string,
  protocolId: string,
  effectiveness: 'high' | 'medium' | 'low',
  context: string
): Promise<Memory> {
  const confidenceMap = {
    high: 0.8,
    medium: 0.5,
    low: 0.3
  };

  return storeMemory({
    user_id: userId,
    type: 'protocol_effectiveness',
    content: `Protocol ${protocolId} has ${effectiveness} effectiveness for user`,
    context,
    confidence: confidenceMap[effectiveness],
    source_protocol_id: protocolId
  });
}
