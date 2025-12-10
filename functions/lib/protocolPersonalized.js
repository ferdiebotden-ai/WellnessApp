"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersonalizedProtocol = getPersonalizedProtocol;
const supabaseClient_1 = require("./supabaseClient");
const memory_1 = require("./memory");
const confidenceScorer_1 = require("./reasoning/confidenceScorer");
/**
 * Map database primary_goal values to PrimaryGoal type
 */
function mapToPrimaryGoal(dbGoal) {
    const mapping = {
        'sleep': 'better_sleep',
        'better_sleep': 'better_sleep',
        'energy': 'more_energy',
        'more_energy': 'more_energy',
        'focus': 'sharper_focus',
        'sharper_focus': 'sharper_focus',
        'recovery': 'faster_recovery',
        'faster_recovery': 'faster_recovery',
        'general_health': 'better_sleep', // Default fallback
    };
    return mapping[dbGoal] || 'better_sleep';
}
/**
 * Normalize citations array from database
 */
function normalizeCitations(value) {
    if (!value)
        return [];
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string' && item.length > 0);
    }
    if (typeof value === 'string' && value.length > 0) {
        return [value];
    }
    return [];
}
/**
 * Fetch enriched protocol data from Supabase
 */
async function fetchProtocolById(protocolId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    const { data, error } = await supabase
        .from('protocols')
        .select(`
      id,
      name,
      description,
      category,
      tier_required,
      benefits,
      constraints,
      citations,
      mechanism_description,
      duration_minutes,
      frequency_per_week,
      parameter_ranges,
      implementation_rules,
      success_metrics,
      study_sources,
      implementation_methods,
      is_active
    `)
        .eq('id', protocolId)
        .single();
    if (error || !data) {
        console.error('[PersonalizedProtocol] Failed to fetch protocol:', error?.message);
        return null;
    }
    if (data.is_active === false) {
        return null;
    }
    return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        tier_required: data.tier_required,
        benefits: data.benefits,
        constraints: data.constraints,
        citations: normalizeCitations(data.citations),
        mechanism_description: data.mechanism_description,
        duration_minutes: data.duration_minutes,
        frequency_per_week: data.frequency_per_week,
        parameter_ranges: data.parameter_ranges || {},
        implementation_rules: data.implementation_rules || {},
        success_metrics: data.success_metrics || [],
        study_sources: data.study_sources || [],
        implementation_methods: data.implementation_methods || [],
    };
}
/**
 * Fetch user's data for this specific protocol
 */
async function fetchUserProtocolData(userId, protocolId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Get last completion and difficulty ratings
    const { data: logs, error: logsError } = await supabase
        .from('protocol_logs')
        .select('logged_at, difficulty_rating, status')
        .eq('user_id', userId)
        .eq('protocol_id', protocolId)
        .eq('status', 'completed')
        .order('logged_at', { ascending: false })
        .limit(30);
    if (logsError) {
        console.error('[PersonalizedProtocol] Failed to fetch logs:', logsError.message);
    }
    const completedLogs = logs || [];
    const lastCompleted = completedLogs[0]?.logged_at || null;
    const totalCompletions = completedLogs.length;
    // Calculate 7-day adherence
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = completedLogs.filter((log) => new Date(log.logged_at) >= sevenDaysAgo);
    // Count unique days with completions
    const uniqueDays = new Set(recentLogs.map((log) => new Date(log.logged_at).toDateString()));
    const adherence7d = uniqueDays.size;
    // Calculate average difficulty
    const ratedLogs = completedLogs.filter((log) => log.difficulty_rating !== null);
    const difficultyAvg = ratedLogs.length > 0
        ? ratedLogs.reduce((sum, log) => sum + (log.difficulty_rating ?? 0), 0) /
            ratedLogs.length
        : null;
    return {
        last_completed_at: lastCompleted,
        adherence_7d: adherence7d,
        difficulty_avg: difficultyAvg !== null ? Math.round(difficultyAvg * 10) / 10 : null,
        total_completions: totalCompletions,
        memory_insight: null, // Will be populated from memories
    };
}
/**
 * Extract insight from memories about user's relationship with protocol
 */
function extractMemoryInsight(memories, protocolId) {
    // Find most relevant memory about this protocol
    const protocolMemories = memories.filter((m) => m.source_protocol_id === protocolId && m.confidence >= 0.5);
    if (protocolMemories.length === 0) {
        return null;
    }
    // Find best memory by type priority
    const preferredTime = protocolMemories.find((m) => m.type === 'preferred_time');
    if (preferredTime) {
        return `You prefer this ${preferredTime.content.includes('morning') ? 'in the morning' : preferredTime.content.includes('evening') ? 'in the evening' : 'at a specific time'}`;
    }
    const effectiveness = protocolMemories.find((m) => m.type === 'protocol_effectiveness');
    if (effectiveness) {
        if (effectiveness.content.includes('high')) {
            return 'This protocol works well for you';
        }
        else if (effectiveness.content.includes('low')) {
            return 'This protocol may need adjustment';
        }
    }
    const feedback = protocolMemories.find((m) => m.type === 'nudge_feedback');
    if (feedback) {
        if (feedback.content.includes('completed')) {
            return 'You usually complete this when nudged';
        }
        else if (feedback.content.includes('dismissed')) {
            return 'You often skip this protocol';
        }
    }
    return null;
}
/**
 * Determine confidence level from overall score
 */
function getConfidenceLevel(overall) {
    if (overall >= 0.7)
        return 'high';
    if (overall >= 0.5)
        return 'medium';
    return 'low';
}
/**
 * Fetch user profile for confidence calculation context
 */
async function fetchUserProfile(userId) {
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Get user profile
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('primary_goal')
        .eq('id', userId)
        .single();
    if (userError) {
        console.error('[PersonalizedProtocol] Failed to fetch user:', userError.message);
    }
    // Get module enrollment
    const { data: enrollment, error: enrollError } = await supabase
        .from('module_enrollment')
        .select('module_id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();
    if (enrollError && enrollError.code !== 'PGRST116') {
        console.error('[PersonalizedProtocol] Failed to fetch enrollment:', enrollError.message);
    }
    // Get latest recovery score
    const { data: recovery, error: recoveryError } = await supabase
        .from('daily_health_summaries')
        .select('recovery_score')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (recoveryError) {
        console.error('[PersonalizedProtocol] Failed to fetch recovery:', recoveryError.message);
    }
    return {
        primary_goal: user?.primary_goal || 'general_health',
        module_id: enrollment?.module_id || 'sleep_optimization',
        recovery_score: recovery?.recovery_score,
    };
}
/**
 * GET /api/protocols/:id/personalized
 *
 * Returns enriched protocol with user-specific personalization data
 */
async function getPersonalizedProtocol(req, res) {
    const protocolId = req.params.id;
    if (!protocolId) {
        res.status(400).json({ error: 'Protocol ID is required' });
        return;
    }
    // Get user ID from auth header (Firebase token)
    const authHeader = req.headers.authorization;
    const userId = req.query.user_id;
    // Try to extract user ID from query or auth
    let effectiveUserId = userId || null;
    if (!effectiveUserId && authHeader?.startsWith('Bearer ')) {
        // In production, validate Firebase token and extract user_id
        // For now, we'll require explicit user_id for testing
        console.log('[PersonalizedProtocol] No user_id provided, returning protocol without personalization');
    }
    try {
        // Fetch protocol data
        const protocol = await fetchProtocolById(protocolId);
        if (!protocol) {
            res.status(404).json({ error: 'Protocol not found' });
            return;
        }
        // If no user, return protocol with default personalization
        if (!effectiveUserId) {
            const defaultResponse = {
                protocol,
                user_data: {
                    last_completed_at: null,
                    adherence_7d: 0,
                    difficulty_avg: null,
                    total_completions: 0,
                    memory_insight: null,
                },
                confidence: {
                    level: 'medium',
                    overall: 0.65,
                    factors: {
                        protocol_fit: 0.7,
                        memory_support: 0.5,
                        timing_fit: 0.7,
                        conflict_risk: 0.8,
                        evidence_strength: 0.85,
                    },
                    reasoning: 'Default confidence. Sign in to see personalized recommendations.',
                },
            };
            res.status(200).json(defaultResponse);
            return;
        }
        // Fetch all personalization data in parallel
        const [userData, userProfile, memories] = await Promise.all([
            fetchUserProtocolData(effectiveUserId, protocolId),
            fetchUserProfile(effectiveUserId),
            (0, memory_1.getRelevantMemories)(effectiveUserId, {
                protocol_id: protocolId,
                time_of_day: (0, confidenceScorer_1.getTimeOfDay)(new Date().getHours()),
            }),
        ]);
        // Extract memory insight
        userData.memory_insight = extractMemoryInsight(memories, protocolId);
        // Build context for confidence calculation
        const currentHour = new Date().getUTCHours();
        const nudgeContext = {
            user_id: effectiveUserId,
            primary_goal: mapToPrimaryGoal(userProfile.primary_goal),
            module_id: userProfile.module_id,
            current_hour_utc: currentHour,
            protocol: {
                id: protocol.id,
                name: protocol.name,
                description: protocol.description,
                category: protocol.category,
                tier_required: protocol.tier_required,
                benefits: protocol.benefits,
                constraints: protocol.constraints,
                citations: protocol.citations,
                score: 1.0, // Top match for direct lookup
            },
            memories: memories,
            time_of_day: (0, confidenceScorer_1.getTimeOfDay)(new Date().getHours()),
            recovery_score: userProfile.recovery_score,
        };
        // Calculate confidence
        const confidenceResult = (0, confidenceScorer_1.calculateConfidence)(nudgeContext);
        const response = {
            protocol,
            user_data: userData,
            confidence: {
                level: getConfidenceLevel(confidenceResult.overall),
                overall: confidenceResult.overall,
                factors: confidenceResult.factors,
                reasoning: confidenceResult.reasoning,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('[PersonalizedProtocol] Error:', error);
        res.status(500).json({ error: 'Failed to fetch personalized protocol' });
    }
}
