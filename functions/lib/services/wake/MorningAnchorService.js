"use strict";
/**
 * Morning Anchor Service for Apex OS Phase 3
 *
 * Handles triggering and scheduling of Morning Anchor nudges
 * based on wake detection events.
 *
 * The Morning Anchor is delivered 5-15 minutes post-wake to catch
 * users in the optimal window for morning habit formation.
 *
 * @file functions/src/services/wake/MorningAnchorService.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MorningAnchorService = void 0;
exports.getMorningAnchorService = getMorningAnchorService;
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("../../firebaseAdmin");
const supabaseClient_1 = require("../../supabaseClient");
const wake_types_1 = require("../../types/wake.types");
const WakeEventRepository_1 = require("./WakeEventRepository");
const protocolSearch_1 = require("../../protocolSearch");
const vertexAI_1 = require("../../vertexAI");
const config_1 = require("../../config");
const suppression_1 = require("../../suppression");
const safety_1 = require("../../safety");
const whyEngine_1 = require("../../reasoning/whyEngine");
const reasoning_1 = require("../../reasoning");
const memory_1 = require("../../memory");
/**
 * Morning Anchor protocol IDs.
 * These protocols are prioritized for morning delivery.
 */
const MORNING_ANCHOR_PROTOCOL_IDS = [
    'proto_morning_light',
    'morning_light_exposure',
    'proto_hydration_electrolytes',
    'hydration_electrolytes',
    'proto_breath_work',
    'physiological_sigh',
];
/**
 * System prompt for Morning Anchor nudge generation.
 */
const MORNING_ANCHOR_SYSTEM_PROMPT = `You are a credible wellness coach delivering a Morning Anchor nudge. This is the first touchpoint of the user's day - be warm but concise. Reference peer-reviewed protocols. Focus on one actionable morning habit. Keep it under 2 sentences. Address the user by name if available. No emojis except 🔥 for streaks. **You must not provide medical advice.**`;
// =============================================================================
// SERVICE CLASS
// =============================================================================
class MorningAnchorService {
    constructor(wakeRepo) {
        this.wakeRepo = wakeRepo || (0, WakeEventRepository_1.getWakeEventRepository)();
        this.firestore = (0, firestore_1.getFirestore)((0, firebaseAdmin_1.getFirebaseApp)());
    }
    /**
     * Trigger Morning Anchor nudge based on wake event.
     *
     * @param input - Trigger input with wake event and context
     * @returns Result indicating success or skip reason
     */
    async triggerMorningAnchor(input) {
        const { wakeEvent, userId, recoveryScore, timezone } = input;
        try {
            // 1. Check skip conditions
            const skipReason = await this.checkSkipConditions(userId, wakeEvent);
            if (skipReason) {
                await this.wakeRepo.markSkipped(wakeEvent.id, skipReason);
                return {
                    triggered: false,
                    skipped: true,
                    skipReason,
                };
            }
            // 2. Calculate optimal trigger time (8 min post-wake)
            const window = (0, wake_types_1.calculateMorningAnchorWindow)(wakeEvent.wakeTime);
            const scheduledFor = window.optimal;
            // 3. Generate Morning Anchor nudge
            const nudgeResult = await this.generateMorningAnchorNudge(userId, wakeEvent, recoveryScore, timezone);
            if (!nudgeResult.success) {
                return {
                    triggered: false,
                    skipped: false,
                    error: nudgeResult.error,
                };
            }
            // 4. Mark wake event as triggered
            await this.wakeRepo.markTriggered(wakeEvent.id, new Date());
            return {
                triggered: true,
                nudgeId: nudgeResult.nudgeId,
                skipped: false,
                scheduledFor,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                triggered: false,
                skipped: false,
                error: `Failed to trigger Morning Anchor: ${errorMessage}`,
            };
        }
    }
    /**
     * Check if Morning Anchor should be skipped.
     *
     * @param userId - User ID
     * @param wakeEvent - Wake event to check
     * @returns Skip reason or null if should proceed
     */
    async checkSkipConditions(userId, wakeEvent) {
        const supabase = (0, supabaseClient_1.getServiceClient)();
        // 1. Check if user has disabled Morning Anchor
        const { data: userPrefs } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', userId)
            .single();
        if (userPrefs?.preferences?.morning_anchor_disabled) {
            return 'user_disabled';
        }
        // 2. Check if already triggered today
        const today = wakeEvent.date;
        const existingResult = await this.wakeRepo.getByUserAndDate(userId, today);
        if (existingResult.data?.morningAnchorTriggeredAt &&
            existingResult.data.id !== wakeEvent.id) {
            return 'already_triggered_today';
        }
        // 3. Check DND mode (via quiet hours)
        const timezone = userPrefs?.preferences?.timezone || 'UTC';
        const quietStart = (0, suppression_1.parseQuietHour)(userPrefs?.preferences?.quiet_start_time);
        const quietEnd = (0, suppression_1.parseQuietHour)(userPrefs?.preferences?.quiet_end_time);
        if (quietStart !== undefined && quietEnd !== undefined) {
            const currentHour = (0, suppression_1.getUserLocalHour)(new Date(), timezone);
            const isInQuietHours = quietStart > quietEnd
                ? currentHour >= quietStart || currentHour < quietEnd // Overnight quiet hours
                : currentHour >= quietStart && currentHour < quietEnd;
            if (isInQuietHours) {
                return 'do_not_disturb';
            }
        }
        // 4. Check for travel (timezone change detection)
        // TODO: Implement timezone change detection in future session
        // 5. Check for weekend sleep-in (optional skip for weekends after 10am)
        const wakeTime = wakeEvent.wakeTime;
        const dayOfWeek = wakeTime.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const wakeHour = wakeTime.getHours();
        // Skip if weekend and waking after 10am (likely intentional sleep-in)
        // User can still get nudges via regular scheduler
        if (isWeekend && wakeHour >= 10) {
            return 'weekend_sleep_in';
        }
        // 6. Check if user has any morning protocols active
        const { data: enrollments } = await supabase
            .from('module_enrollment')
            .select('module_id')
            .eq('user_id', userId);
        if (!enrollments || enrollments.length === 0) {
            return 'no_protocols_active';
        }
        return null; // No skip reason - proceed with Morning Anchor
    }
    /**
     * Generate and deliver Morning Anchor nudge.
     *
     * @param userId - User ID
     * @param wakeEvent - Wake event triggering this nudge
     * @param recoveryScore - Optional recovery score for context
     * @param timezone - User's timezone
     */
    async generateMorningAnchorNudge(userId, wakeEvent, recoveryScore, timezone) {
        const config = (0, config_1.getConfig)();
        const supabase = (0, supabaseClient_1.getServiceClient)();
        try {
            // 1. Fetch user profile
            const { data: profile } = await supabase
                .from('users')
                .select('id, display_name, primary_goal, healthMetrics, preferences')
                .eq('id', userId)
                .single();
            if (!profile) {
                return { success: false, error: 'User profile not found' };
            }
            // 2. Get enrolled modules
            const { data: enrollments } = await supabase
                .from('module_enrollment')
                .select('module_id')
                .eq('user_id', userId);
            const moduleIds = enrollments?.map((e) => e.module_id) || [];
            const primaryModule = moduleIds[0] || 'sleep_optimization';
            // 3. Query for morning-specific protocols
            const query = 'morning light exposure hydration optimization';
            const embedding = await (0, protocolSearch_1.generateEmbedding)(query);
            const pineconeHost = await (0, protocolSearch_1.resolvePineconeHost)(config.pineconeApiKey, config.pineconeIndexName);
            const matches = await (0, protocolSearch_1.queryPinecone)(config.pineconeApiKey, pineconeHost, embedding, 5);
            const protocols = await (0, protocolSearch_1.fetchProtocols)(supabase, matches.map((m) => m.id));
            const ragResults = (0, protocolSearch_1.mapProtocols)(matches, protocols);
            // 4. Filter to morning anchor protocols
            const morningProtocols = ragResults.filter((p) => MORNING_ANCHOR_PROTOCOL_IDS.some((id) => p.id.toLowerCase().includes(id.toLowerCase())));
            // Fallback to any protocol if no specific morning ones found
            const protocolsToUse = morningProtocols.length > 0 ? morningProtocols : ragResults.slice(0, 2);
            if (protocolsToUse.length === 0) {
                return { success: false, error: 'No protocols available' };
            }
            // 5. Get user memories for personalization
            const memories = await (0, memory_1.getRelevantMemories)(userId, { module_id: primaryModule, min_confidence: 0.2 }, 5);
            // 6. Calculate confidence for best protocol
            const currentHour = new Date().getUTCHours();
            const timeOfDay = (0, reasoning_1.getTimeOfDay)(currentHour);
            const bestProtocol = protocolsToUse[0];
            const nudgeContext = {
                user_id: userId,
                primary_goal: profile.primary_goal || 'better_sleep',
                module_id: primaryModule,
                current_hour_utc: currentHour,
                time_of_day: timeOfDay,
                recovery_score: recoveryScore,
                protocol: bestProtocol,
                memories,
                other_protocols: protocolsToUse.slice(1),
            };
            const confidence = (0, reasoning_1.calculateConfidence)(nudgeContext);
            // 7. Check suppression (but Morning Anchor has exemptions)
            const suppressionContext = (0, suppression_1.buildSuppressionContext)({
                nudgePriority: 'CRITICAL', // Morning Anchor is high priority
                confidenceScore: confidence.overall,
                userLocalHour: (0, suppression_1.getUserLocalHour)(new Date(), timezone),
                userPreferences: {
                    quiet_hours_start: (0, suppression_1.parseQuietHour)(profile.preferences?.quiet_start_time),
                    quiet_hours_end: (0, suppression_1.parseQuietHour)(profile.preferences?.quiet_end_time),
                    timezone,
                },
                nudgesDeliveredToday: 0, // First nudge of day
                lastNudgeDeliveredAt: null,
                dismissalsToday: 0,
                meetingHoursToday: 0,
                recoveryScore: recoveryScore ?? 100,
                isMorningAnchor: true, // This gives us exemptions
                currentStreak: 0,
                mvdActive: false,
                isMvdApprovedNudge: false,
            });
            const suppressionResult = (0, suppression_1.evaluateSuppression)(suppressionContext);
            // Session 72: Log suppression decision for analytics
            void (0, suppression_1.logSuppressionResult)({
                firebaseUid: userId, // MorningAnchor uses Firebase UID directly
                nudgeId: `morning_anchor_${Date.now()}_${userId.substring(0, 8)}`,
                nudgeType: 'morning_anchor',
                nudgePriority: 'CRITICAL',
                protocolId: bestProtocol.id,
                result: suppressionResult,
                context: suppressionContext,
            });
            if (!suppressionResult.shouldDeliver) {
                // Log suppression but still allow if exempted
                console.log(`[MorningAnchor] Suppression check: ${suppressionResult.reason}`);
            }
            // 8. Build context and generate nudge
            const memoryContext = memories.length > 0
                ? `\nUser Memories:\n${memories
                    .map((m) => `- [${m.type}] ${m.content}`)
                    .join('\n')}`
                : '';
            const userPrompt = `
        User: ${profile.display_name || 'Morning Champion'}
        Wake Time: ${wakeEvent.wakeTime.toISOString()}
        Recovery Score: ${recoveryScore ?? 'N/A'}
        Focus Module: ${primaryModule}
        ${memoryContext}

        Morning Protocol: ${bestProtocol.name}
        Benefits: ${bestProtocol.benefits}
        Evidence: ${bestProtocol.citations?.join(', ') || 'Evidence-based'}

        Task: Generate a warm, concise Morning Anchor nudge (max 2 sentences) to start the user's day with this protocol. Make it feel like a friendly coach greeting them.
      `;
            let nudgeText = await (0, vertexAI_1.generateCompletion)(MORNING_ANCHOR_SYSTEM_PROMPT, userPrompt);
            // 9. Safety scan
            const safetyScan = (0, safety_1.scanAIOutput)(nudgeText, 'nudge');
            if (!safetyScan.safe) {
                console.warn(`[MorningAnchor] Nudge flagged for user ${userId}:`, safetyScan.reason);
                nudgeText = (0, safety_1.getSafeFallbackResponse)('nudge');
            }
            // 10. Generate WhyExpansion for reasoning transparency
            const whyExpansion = await (0, whyEngine_1.generateWhyExpansion)({
                protocol: bestProtocol,
                confidence,
                memories,
                userId,
            });
            // 11. Write to Firestore
            const now = new Date().toISOString();
            const taskDoc = {
                title: nudgeText,
                status: 'pending',
                scheduled_for: now,
                emphasis: 'critical', // Morning Anchor is highest priority
                type: 'morning_anchor',
                module_id: primaryModule,
                protocol_id: bestProtocol.id,
                citations: bestProtocol.citations || [],
                created_at: now,
                wake_event_id: wakeEvent.id,
                confidence_score: confidence.overall,
                confidence_reasoning: confidence.reasoning,
                why_expansion: whyExpansion,
            };
            const docRef = await this.firestore
                .collection('live_nudges')
                .doc(userId)
                .collection('entries')
                .add(taskDoc);
            // 12. Log to audit
            await supabase.from('ai_audit_log').insert({
                user_id: userId,
                decision_type: 'morning_anchor_generated',
                model_used: (0, vertexAI_1.getCompletionModelName)(),
                prompt: userPrompt,
                response: nudgeText,
                reasoning: `Morning Anchor triggered by ${wakeEvent.detectionMethod} detection`,
                module_id: primaryModule,
                protocol_id: bestProtocol.id,
                confidence_score: confidence.overall,
                confidence_factors: confidence.factors,
                was_suppressed: false,
                metadata: {
                    wake_event_id: wakeEvent.id,
                    wake_time: wakeEvent.wakeTime.toISOString(),
                    detection_method: wakeEvent.detectionMethod,
                    wake_confidence: wakeEvent.confidence,
                },
            });
            return { success: true, nudgeId: docRef.id };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[MorningAnchor] Failed to generate nudge:', error);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * Get user preferences for Morning Anchor.
     *
     * @param userId - User ID
     */
    async getUserPreferences(userId) {
        const supabase = (0, supabaseClient_1.getServiceClient)();
        const { data } = await supabase
            .from('users')
            .select('preferences')
            .eq('id', userId)
            .single();
        return {
            morningAnchorEnabled: !data?.preferences?.morning_anchor_disabled,
            earliestNotificationHour: data?.preferences?.earliest_notification_hour || 5,
            quietHoursStart: data?.preferences?.quiet_start_time,
            quietHoursEnd: data?.preferences?.quiet_end_time,
            timezone: data?.preferences?.timezone,
        };
    }
}
exports.MorningAnchorService = MorningAnchorService;
// =============================================================================
// SINGLETON EXPORT
// =============================================================================
let serviceInstance = null;
function getMorningAnchorService() {
    if (!serviceInstance) {
        serviceInstance = new MorningAnchorService();
    }
    return serviceInstance;
}
// Also export class for testing
exports.default = MorningAnchorService;
