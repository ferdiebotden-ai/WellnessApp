"use strict";
/**
 * Memory Layer - Core CRUD Operations
 *
 * Manages user-specific learnings that persist across sessions.
 * Memories have confidence scores that decay over time without reinforcement.
 *
 * Reference: APEX_OS_PRD_FINAL_v6.md - Section 3.2 Memory Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeMemory = storeMemory;
exports.reinforceMemory = reinforceMemory;
exports.getRelevantMemories = getRelevantMemories;
exports.getAllUserMemories = getAllUserMemories;
exports.updateMemory = updateMemory;
exports.deleteMemory = deleteMemory;
exports.deleteAllUserMemories = deleteAllUserMemories;
exports.applyMemoryDecay = applyMemoryDecay;
exports.pruneMemories = pruneMemories;
exports.getMemoryStats = getMemoryStats;
exports.createFromNudgeFeedback = createFromNudgeFeedback;
exports.createFromStatedPreference = createFromStatedPreference;
exports.createProtocolEffectivenessMemory = createProtocolEffectivenessMemory;
const supabaseClient_1 = require("../supabaseClient");
const types_1 = require("./types");
/**
 * Store a new memory or update existing one if duplicate found
 *
 * Deduplication: If a memory with same user_id, type, and similar content exists,
 * the existing memory is reinforced (confidence boosted, evidence_count incremented)
 */
async function storeMemory(input) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Check for existing similar memory
    const { data: existing } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('type', input.type)
        .ilike('content', `%${input.content.substring(0, 50)}%`)
        .gte('confidence', types_1.MEMORY_CONFIG.MIN_CONFIDENCE_THRESHOLD)
        .limit(1)
        .maybeSingle();
    if (existing) {
        // Reinforce existing memory
        return reinforceMemory(existing.id, input.context);
    }
    // Calculate expiration if applicable
    const expirationDays = types_1.DEFAULT_EXPIRATION_DAYS[input.type];
    let expires_at;
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
        confidence: input.confidence ?? types_1.MEMORY_CONFIG.DEFAULT_CONFIDENCE,
        evidence_count: 1,
        decay_rate: input.decay_rate ?? types_1.MEMORY_CONFIG.DEFAULT_DECAY_RATE,
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
    return data;
}
/**
 * Reinforce an existing memory - boost confidence and increment evidence
 * Called when the same pattern is observed again
 */
async function reinforceMemory(memoryId, newContext) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
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
    if (current.evidence_count + 1 >= types_1.MEMORY_CONFIG.HIGH_EVIDENCE_THRESHOLD) {
        newDecayRate = Math.max(types_1.MEMORY_CONFIG.MIN_DECAY_RATE, current.decay_rate * types_1.MEMORY_CONFIG.HIGH_EVIDENCE_DECAY_REDUCTION);
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
    return data;
}
/**
 * Get memories relevant to the current context
 * Used by nudge engine to personalize recommendations
 */
async function getRelevantMemories(userId, context, limit = 10) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Build query
    let query = supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', userId)
        .gte('confidence', context.min_confidence ?? types_1.MEMORY_CONFIG.MIN_CONFIDENCE_THRESHOLD)
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
    const scored = data.map(memory => ({
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
        const priorityA = types_1.MEMORY_TYPE_PRIORITY[a.type];
        const priorityB = types_1.MEMORY_TYPE_PRIORITY[b.type];
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
function calculateRelevanceScore(memory, context) {
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
    }
    else if (daysSinceUse > 30) {
        score *= 0.8;
    }
    // High-evidence memories get a boost
    if (memory.evidence_count >= types_1.MEMORY_CONFIG.HIGH_EVIDENCE_THRESHOLD) {
        score *= 1.1;
    }
    return Math.min(1, score); // Cap at 1
}
/**
 * Get all memories for a user (for data export/GDPR)
 */
async function getAllUserMemories(userId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    const { data, error } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) {
        throw new Error(`Failed to fetch user memories: ${error.message}`);
    }
    return data;
}
/**
 * Update a specific memory
 */
async function updateMemory(memoryId, updates) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
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
    return data;
}
/**
 * Delete a specific memory
 */
async function deleteMemory(memoryId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
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
async function deleteAllUserMemories(userId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
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
async function applyMemoryDecay(userId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
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
    }
    else {
        // Use PostgreSQL function for global decay (more efficient)
        const { data, error } = await supabase.rpc('apply_memory_decay');
        if (error) {
            console.error('Memory decay RPC failed:', error);
            throw new Error(`Global memory decay failed: ${error.message}`);
        }
        return data;
    }
}
/**
 * Prune memories for a user - remove expired, low-confidence, and enforce max limit
 * Called by daily scheduler job
 *
 * Uses the PostgreSQL function prune_user_memories() for efficiency
 */
async function pruneMemories(userId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Use PostgreSQL function for efficient pruning
    const { data, error } = await supabase.rpc('prune_user_memories', {
        target_user_id: userId
    });
    if (error) {
        console.error('Memory pruning RPC failed:', error);
        throw new Error(`Memory pruning failed: ${error.message}`);
    }
    return data;
}
/**
 * Get memory statistics for a user
 * Useful for debugging and analytics
 */
async function getMemoryStats(userId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    const { data, error } = await supabase
        .from('user_memories')
        .select('type, confidence, created_at')
        .eq('user_id', userId);
    if (error) {
        throw new Error(`Failed to get memory stats: ${error.message}`);
    }
    const memories = data;
    const byType = {};
    let totalConfidence = 0;
    let oldest = null;
    let newest = null;
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
        byType: byType,
        avgConfidence: memories.length > 0 ? totalConfidence / memories.length : 0,
        oldestMemory: oldest,
        newestMemory: newest
    };
}
/**
 * Create memory from nudge feedback
 * Called by analyzeNudgeFeedback.ts when user responds to a nudge
 */
async function createFromNudgeFeedback(userId, nudgeId, protocolId, feedback, context) {
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
async function createFromStatedPreference(userId, preference, isConstraint = false, source) {
    return storeMemory({
        user_id: userId,
        type: isConstraint ? 'preference_constraint' : 'stated_preference',
        content: preference,
        context: source ?? 'User stated preference',
        confidence: 0.9, // High confidence for explicit statements
        decay_rate: types_1.MEMORY_CONFIG.MIN_DECAY_RATE // Slow decay for stated preferences
    });
}
/**
 * Create memory for protocol effectiveness
 * Called when analyzing which protocols work well for user
 */
async function createProtocolEffectivenessMemory(userId, protocolId, effectiveness, context) {
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
