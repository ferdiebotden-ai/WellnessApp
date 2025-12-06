"use strict";
/**
 * Weekly Synthesis Narrative Generator
 *
 * Generates AI-powered weekly narratives summarizing user progress.
 * Uses Gemini 2.5 Flash for reasoning-enhanced text generation.
 *
 * Output: ~200 word narrative with 5 sections:
 *   1. WIN OF THE WEEK - What improved, with specific numbers
 *   2. AREA TO WATCH - What declined or needs attention
 *   3. PATTERN INSIGHT - A correlation from their data
 *   4. TRAJECTORY PREDICTION - If trends continue, what happens
 *   5. EXPERIMENT - One achievable action for next week
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWeeklyNarrative = generateWeeklyNarrative;
exports.validateNarrative = validateNarrative;
const vertexAI_1 = require("../vertexAI");
const safety_1 = require("../safety");
const memory_1 = require("../memory");
const types_1 = require("./types");
/**
 * System prompt for the wellness coach persona
 */
const SYSTEM_PROMPT = `You are a credible wellness coach for performance professionals.
Use evidence-based language. Reference peer-reviewed studies when relevant.
Celebrate progress based on health outcomes (HRV improvement, sleep quality gains), not arbitrary milestones.
Tone is professional, motivational but not cheesy.
Address user by name occasionally.
Use 🔥 emoji only for streaks (professional standard). No other emojis.
**You must not provide medical advice.** You are an educational tool.`;
/**
 * Build the user prompt with all context for narrative generation
 */
function buildUserPrompt(user, metrics, memories) {
    const memoryContext = memories.length > 0
        ? memories.map((m) => `- [${m.type}] ${m.content} (confidence: ${m.confidence.toFixed(2)})`).join('\n')
        : 'No prior patterns detected yet.';
    const protocolSummary = metrics.protocol_breakdown
        .slice(0, 5)
        .map((p) => `- ${p.name}: ${p.completed_days}/7 days (${p.completion_rate}%)`)
        .join('\n');
    const correlationSummary = metrics.correlations.length > 0
        ? metrics.correlations
            .slice(0, 3)
            .map((c) => `- ${c.protocol_name} → ${c.outcome}: r=${c.correlation.toFixed(2)} (${c.interpretation})`)
            .join('\n')
        : 'Not enough data for correlations yet.';
    return `You are writing a weekly wellness synthesis for a high-performing professional.

USER CONTEXT:
- Name: ${user.display_name}
- Primary Goal: ${user.primary_goal || 'General wellness optimization'}
- Week: ${metrics.week_start} to ${metrics.week_end}

METRICS:
- Protocol Adherence: ${metrics.protocol_adherence}%
- Days Active: ${metrics.days_with_completion}/7
- Total Protocols Completed: ${metrics.total_protocols_completed}
- Recovery Score: ${metrics.avg_recovery_score !== null ? `${metrics.avg_recovery_score}/100` : 'No wearable data'}
- HRV Trend: ${metrics.hrv_trend_percent !== null ? `${metrics.hrv_trend_percent > 0 ? '+' : ''}${metrics.hrv_trend_percent.toFixed(1)}%` : 'N/A'}
- Sleep Trend: ${metrics.sleep_quality_trend_percent !== null ? `${metrics.sleep_quality_trend_percent > 0 ? '+' : ''}${metrics.sleep_quality_trend_percent.toFixed(1)}%` : 'N/A'}

PROTOCOL BREAKDOWN:
${protocolSummary || 'No protocols completed this week.'}

WEEK-OVER-WEEK CHANGE:
- Adherence: ${metrics.week_over_week.protocol_adherence_change !== null ? `${metrics.week_over_week.protocol_adherence_change > 0 ? '+' : ''}${metrics.week_over_week.protocol_adherence_change}%` : 'N/A'}
- Recovery: ${metrics.week_over_week.recovery_score_change !== null ? `${metrics.week_over_week.recovery_score_change > 0 ? '+' : ''}${metrics.week_over_week.recovery_score_change} pts` : 'N/A'}

CORRELATIONS DETECTED:
${correlationSummary}

MEMORIES (patterns we've learned about this user):
${memoryContext}

TASK: Write a ~200 word narrative with these sections:
1. WIN OF THE WEEK: What improved, with specific numbers
2. AREA TO WATCH: What declined or needs attention
3. PATTERN INSIGHT: A correlation from their data (or general wellness insight if no correlations)
4. TRAJECTORY PREDICTION: If trends continue, what happens
5. EXPERIMENT: One achievable action for next week

REQUIREMENTS:
- Use their name once naturally
- Include at least 2 specific numbers from their data
- No bullet points - narrative prose only
- Experiment must not require new equipment or major time commitment
- Keep each section to 1-2 sentences
- Total length: 150-250 words

Output the narrative only, no JSON wrapper or section headers.`;
}
/**
 * Detect which narrative sections are present in the generated text
 */
function detectSections(narrative) {
    const lowerNarrative = narrative.toLowerCase();
    const detected = [];
    // Keywords that indicate each section
    const sectionIndicators = {
        Win: ['improved', 'up from', 'increased', 'achieved', 'completed', 'gained', 'better', 'win'],
        Watch: ['watch', 'attention', 'declined', 'dropped', 'decreased', 'lower', 'concern', 'need'],
        Pattern: ['pattern', 'correlation', 'notice', 'when you', 'days when', 'tends to', 'associated'],
        Trajectory: ['continue', 'trajectory', 'if this', 'pace', 'trend', 'projection', 'heading'],
        Experiment: ['try', 'experiment', 'next week', 'consider', 'suggestion', 'recommend', 'test'],
    };
    for (const section of types_1.NARRATIVE_SECTIONS) {
        const indicators = sectionIndicators[section];
        if (indicators.some((keyword) => lowerNarrative.includes(keyword))) {
            detected.push(section);
        }
    }
    return detected;
}
/**
 * Count words in a text string
 */
function countWords(text) {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}
/**
 * Generate fallback narrative when AI generation fails or data is insufficient
 */
function generateFallbackNarrative(user, metrics, reason) {
    if (metrics.data_days_available < types_1.SYNTHESIS_CONFIG.MIN_DATA_DAYS) {
        return `${user.display_name}, your Weekly Brief needs a bit more data to generate meaningful insights. ` +
            `You've logged ${metrics.data_days_available} days this week — just ${types_1.SYNTHESIS_CONFIG.MIN_DATA_DAYS - metrics.data_days_available} more days of tracking ` +
            `will unlock your personalized synthesis. Keep logging your protocols, and we'll have a full analysis ready next Sunday. ` +
            `Every day of data helps Apex OS learn your patterns and provide better guidance.`;
    }
    return `${user.display_name}, your Weekly Brief is being prepared. ` +
        `This week you completed ${metrics.total_protocols_completed} protocols across ${metrics.days_with_completion} days ` +
        `with ${metrics.protocol_adherence}% adherence. ${reason}. ` +
        `Continue tracking, and your next synthesis will include deeper pattern analysis.`;
}
/**
 * Generate a weekly narrative synthesis for a user
 *
 * @param user - User context (name, goal, timezone)
 * @param metrics - Aggregated weekly metrics
 * @param memories - Optional array of user memories (will fetch if not provided)
 * @returns WeeklySynthesisResult with narrative and metadata
 */
async function generateWeeklyNarrative(user, metrics, memories) {
    const generatedAt = new Date().toISOString();
    // Check minimum data requirements
    if (metrics.data_days_available < types_1.SYNTHESIS_CONFIG.MIN_DATA_DAYS) {
        const fallback = generateFallbackNarrative(user, metrics, 'Insufficient data for full analysis');
        return {
            user_id: metrics.user_id,
            week_start: metrics.week_start,
            week_end: metrics.week_end,
            narrative: fallback,
            metrics_snapshot: metrics,
            generated_at: generatedAt,
            word_count: countWords(fallback),
            sections_detected: [],
        };
    }
    // Fetch memories if not provided
    // Use pattern_detected type for synthesis context
    const userMemories = memories ?? await (0, memory_1.getRelevantMemories)(metrics.user_id, { memory_types: ['pattern_detected', 'protocol_effectiveness'], min_confidence: 0.2 }, 5);
    // Build prompt and generate narrative
    const userPrompt = buildUserPrompt(user, metrics, userMemories);
    let narrative;
    try {
        narrative = await (0, vertexAI_1.generateCompletion)(SYSTEM_PROMPT, userPrompt, 0.7);
    }
    catch (err) {
        console.error('[NarrativeGenerator] AI generation failed:', err);
        const fallback = generateFallbackNarrative(user, metrics, 'Generation temporarily unavailable');
        return {
            user_id: metrics.user_id,
            week_start: metrics.week_start,
            week_end: metrics.week_end,
            narrative: fallback,
            metrics_snapshot: metrics,
            generated_at: generatedAt,
            word_count: countWords(fallback),
            sections_detected: [],
        };
    }
    // Safety scan the generated content (use 'ai_response' type)
    const safetyScan = (0, safety_1.scanAIOutput)(narrative, 'ai_response');
    if (!safetyScan.safe) {
        console.warn('[NarrativeGenerator] Content flagged:', safetyScan.reason);
        narrative = (0, safety_1.getSafeFallbackResponse)('ai_response');
    }
    // Detect sections and count words
    const sectionsDetected = detectSections(narrative);
    const wordCount = countWords(narrative);
    // Log quality metrics
    console.log(`[NarrativeGenerator] Generated for ${metrics.user_id}: ` +
        `${wordCount} words, ${sectionsDetected.length}/5 sections detected`);
    return {
        user_id: metrics.user_id,
        week_start: metrics.week_start,
        week_end: metrics.week_end,
        narrative,
        metrics_snapshot: metrics,
        generated_at: generatedAt,
        word_count: wordCount,
        sections_detected: sectionsDetected,
    };
}
/**
 * Validate a narrative meets quality requirements
 */
function validateNarrative(result) {
    const issues = [];
    // Check word count
    if (result.word_count < types_1.SYNTHESIS_CONFIG.MIN_WORD_COUNT) {
        issues.push(`Word count too low: ${result.word_count} < ${types_1.SYNTHESIS_CONFIG.MIN_WORD_COUNT}`);
    }
    if (result.word_count > types_1.SYNTHESIS_CONFIG.MAX_WORD_COUNT) {
        issues.push(`Word count too high: ${result.word_count} > ${types_1.SYNTHESIS_CONFIG.MAX_WORD_COUNT}`);
    }
    // Check section coverage
    if (result.sections_detected.length < 3) {
        issues.push(`Too few sections detected: ${result.sections_detected.length}/5`);
    }
    return {
        valid: issues.length === 0,
        issues,
    };
}
