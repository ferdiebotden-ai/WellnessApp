"use strict";
/**
 * Weekly Synthesis Aggregation
 *
 * Aggregates user metrics for weekly synthesis generation.
 * Queries protocol logs, wearable data, and calculates correlations.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateWeeklyMetrics = aggregateWeeklyMetrics;
exports.getWeekMonday = getWeekMonday;
exports.getWeekSunday = getWeekSunday;
const supabaseClient_1 = require("../supabaseClient");
const correlations_1 = require("./correlations");
const types_1 = require("./types");
/**
 * Aggregates all weekly metrics for a user within a date range.
 *
 * @param userId - Supabase user UUID
 * @param weekStart - Start of week (Monday) as Date or ISO string
 * @param weekEnd - End of week (Sunday) as Date or ISO string
 * @returns Complete WeeklyMetrics object
 */
async function aggregateWeeklyMetrics(userId, weekStart, weekEnd) {
    const startDate = typeof weekStart === 'string' ? new Date(weekStart) : weekStart;
    const endDate = typeof weekEnd === 'string' ? new Date(weekEnd) : weekEnd;
    // Normalize to ISO date strings
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    // Calculate prior week for week-over-week comparison
    const priorWeekStart = new Date(startDate);
    priorWeekStart.setDate(priorWeekStart.getDate() - 7);
    const priorWeekEnd = new Date(endDate);
    priorWeekEnd.setDate(priorWeekEnd.getDate() - 7);
    const priorStartStr = priorWeekStart.toISOString().split('T')[0];
    const priorEndStr = priorWeekEnd.toISOString().split('T')[0];
    // Calculate lookback for correlation analysis
    const correlationLookbackStart = new Date(endDate);
    correlationLookbackStart.setDate(correlationLookbackStart.getDate() - types_1.SYNTHESIS_CONFIG.CORRELATION_LOOKBACK_DAYS);
    const correlationStartStr = correlationLookbackStart.toISOString().split('T')[0];
    const supabase = (0, supabaseClient_1.getServiceClient)();
    // Execute all queries in parallel
    const [currentWeekLogsResult, priorWeekLogsResult, protocolNamesResult, wearableDataResult, enrolledProtocolsResult, correlationLogsResult, correlationWearableResult,] = await Promise.all([
        // Current week protocol logs
        supabase
            .from('protocol_logs')
            .select('id, user_id, protocol_id, module_id, source, status, logged_at, duration_minutes')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('logged_at', startStr)
            .lte('logged_at', `${endStr}T23:59:59.999Z`),
        // Prior week protocol logs (for week-over-week)
        supabase
            .from('protocol_logs')
            .select('id, user_id, protocol_id, module_id, source, status, logged_at, duration_minutes')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('logged_at', priorStartStr)
            .lte('logged_at', `${priorEndStr}T23:59:59.999Z`),
        // Protocol names for lookup
        supabase.from('protocols').select('id, name'),
        // Wearable data for the week
        fetchWearableData(supabase, userId, startStr, endStr),
        // Enrolled protocols
        supabase
            .from('module_enrollment')
            .select('module_id')
            .eq('user_id', userId)
            .then(async (enrollmentResult) => {
            if (enrollmentResult.error || !enrollmentResult.data?.length) {
                return { data: [], error: null };
            }
            const moduleIds = enrollmentResult.data.map((e) => e.module_id);
            return supabase
                .from('module_protocol_map')
                .select('protocol_id, module_id')
                .in('module_id', moduleIds);
        }),
        // 30-day logs for correlation analysis
        supabase
            .from('protocol_logs')
            .select('id, user_id, protocol_id, module_id, source, status, logged_at, duration_minutes')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('logged_at', correlationStartStr)
            .lte('logged_at', `${endStr}T23:59:59.999Z`),
        // 30-day wearable data for correlation analysis
        fetchWearableData(supabase, userId, correlationStartStr, endStr),
    ]);
    // Extract data with safe fallbacks
    const currentWeekLogs = (currentWeekLogsResult.data || []);
    const priorWeekLogs = (priorWeekLogsResult.data || []);
    const protocolNames = (protocolNamesResult.data || []);
    const wearableData = wearableDataResult;
    const enrolledProtocols = (enrolledProtocolsResult.data || []);
    const correlationLogs = (correlationLogsResult.data || []);
    const correlationWearable = correlationWearableResult;
    // Build protocol name lookup map
    const protocolNameMap = new Map(protocolNames.map((p) => [p.id, p.name]));
    // Calculate all metrics
    const protocolBreakdown = calculateProtocolBreakdown(currentWeekLogs, protocolNameMap);
    const daysWithCompletion = calculateDaysWithCompletion(currentWeekLogs);
    const totalCompleted = currentWeekLogs.length;
    const adherence = calculateAdherence(currentWeekLogs, enrolledProtocols, protocolNameMap);
    const wearableMetrics = calculateWearableMetrics(wearableData);
    const weekOverWeek = calculateWeekOverWeek(currentWeekLogs, priorWeekLogs, enrolledProtocols, protocolNameMap, wearableData, await fetchWearableData(supabase, userId, priorStartStr, priorEndStr));
    const correlations = calculateCorrelations(correlationLogs, correlationWearable, protocolNameMap);
    return {
        user_id: userId,
        week_start: startStr,
        week_end: endStr,
        protocol_adherence: adherence,
        days_with_completion: daysWithCompletion,
        total_protocols_completed: totalCompleted,
        avg_recovery_score: wearableMetrics.avgRecovery,
        hrv_trend_percent: wearableMetrics.hrvTrend,
        sleep_quality_trend_percent: wearableMetrics.sleepTrend,
        protocol_breakdown: protocolBreakdown,
        correlations,
        data_days_available: wearableMetrics.dataDays,
        has_wearable_data: wearableMetrics.hasData,
        week_over_week: weekOverWeek,
        generated_at: new Date().toISOString(),
    };
}
/**
 * Fetches wearable data with graceful error handling.
 * Returns empty array if table doesn't exist or query fails.
 */
async function fetchWearableData(supabase, userId, startStr, endStr) {
    try {
        const { data, error } = await supabase
            .from('wearable_data_archive')
            .select('id, user_id, source, recorded_at, hrv_score, hrv_rmssd_ms, sleep_hours, resting_hr_bpm, readiness_score')
            .eq('user_id', userId)
            .gte('recorded_at', startStr)
            .lte('recorded_at', `${endStr}T23:59:59.999Z`)
            .order('recorded_at', { ascending: true });
        if (error) {
            // Log warning but don't fail - wearable data may not be available yet
            console.warn('[WeeklySynthesis] Wearable data fetch failed:', error.message);
            return [];
        }
        return (data || []);
    }
    catch (err) {
        console.warn('[WeeklySynthesis] Wearable data fetch exception:', err);
        return [];
    }
}
/**
 * Calculates per-protocol breakdown statistics.
 */
function calculateProtocolBreakdown(logs, protocolNameMap) {
    const byProtocol = new Map();
    for (const log of logs) {
        const dayKey = log.logged_at.split('T')[0];
        const existing = byProtocol.get(log.protocol_id) || {
            days: new Set(),
            totalCompletions: 0,
            durations: [],
        };
        existing.days.add(dayKey);
        existing.totalCompletions += 1;
        if (log.duration_minutes !== null) {
            existing.durations.push(log.duration_minutes);
        }
        byProtocol.set(log.protocol_id, existing);
    }
    const breakdown = [];
    for (const [protocolId, stats] of byProtocol) {
        const completedDays = stats.days.size;
        const avgDuration = stats.durations.length > 0
            ? Math.round(stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length)
            : null;
        breakdown.push({
            protocol_id: protocolId,
            name: protocolNameMap.get(protocolId) || protocolId,
            completed_days: completedDays,
            total_completions: stats.totalCompletions,
            avg_duration_minutes: avgDuration,
            completion_rate: Math.round((completedDays / 7) * 100),
        });
    }
    // Sort by completion days descending
    return breakdown.sort((a, b) => b.completed_days - a.completed_days);
}
/**
 * Calculates the number of unique days with at least one completion.
 */
function calculateDaysWithCompletion(logs) {
    const uniqueDays = new Set();
    for (const log of logs) {
        uniqueDays.add(log.logged_at.split('T')[0]);
    }
    return uniqueDays.size;
}
/**
 * Calculates overall protocol adherence percentage.
 * Formula: (unique protocol-days completed) / (enrolled protocols * 7) * 100
 */
function calculateAdherence(logs, enrolledProtocols, protocolNameMap) {
    // Get unique enrolled protocol IDs
    const enrolledIds = new Set(enrolledProtocols.map((e) => e.protocol_id));
    // If no enrolled protocols, use all completed protocols as the basis
    if (enrolledIds.size === 0) {
        const completedIds = new Set(logs.map((l) => l.protocol_id));
        if (completedIds.size === 0)
            return 0;
        // Calculate based on completed protocols
        const uniqueDays = calculateDaysWithCompletion(logs);
        return Math.round((uniqueDays / 7) * 100);
    }
    // Count unique protocol-day combinations for enrolled protocols
    const protocolDays = new Set();
    for (const log of logs) {
        if (enrolledIds.has(log.protocol_id)) {
            const dayKey = log.logged_at.split('T')[0];
            protocolDays.add(`${log.protocol_id}:${dayKey}`);
        }
    }
    const maxPossible = enrolledIds.size * 7;
    const achieved = protocolDays.size;
    return Math.round((achieved / maxPossible) * 100);
}
/**
 * Calculates wearable-derived metrics (recovery, HRV trend, sleep trend).
 */
function calculateWearableMetrics(wearableData) {
    if (wearableData.length === 0) {
        return {
            avgRecovery: null,
            hrvTrend: null,
            sleepTrend: null,
            dataDays: 0,
            hasData: false,
        };
    }
    // Calculate average recovery score
    const recoveryScores = wearableData
        .map((d) => d.readiness_score)
        .filter((s) => s !== null);
    const avgRecovery = recoveryScores.length > 0
        ? Math.round(recoveryScores.reduce((sum, s) => sum + s, 0) / recoveryScores.length)
        : null;
    // Calculate trends using first half vs second half comparison
    const hrvTrend = calculateTrendPercent(wearableData.map((d) => d.hrv_score));
    const sleepTrend = calculateTrendPercent(wearableData.map((d) => d.sleep_hours));
    // Count unique days with data
    const uniqueDays = new Set(wearableData.map((d) => d.recorded_at.split('T')[0]));
    return {
        avgRecovery,
        hrvTrend,
        sleepTrend,
        dataDays: uniqueDays.size,
        hasData: true,
    };
}
/**
 * Calculates percentage trend by comparing first half to second half of data.
 * Positive = improvement, Negative = decline.
 */
function calculateTrendPercent(values) {
    const validValues = values.filter((v) => v !== null);
    if (validValues.length < 4) {
        return null; // Need at least 4 points for meaningful trend
    }
    const midpoint = Math.floor(validValues.length / 2);
    const firstHalf = validValues.slice(0, midpoint);
    const secondHalf = validValues.slice(midpoint);
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;
    if (firstAvg === 0)
        return null;
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    return Math.round(percentChange * 10) / 10; // Round to 1 decimal
}
/**
 * Calculates week-over-week comparison metrics.
 */
function calculateWeekOverWeek(currentLogs, priorLogs, enrolledProtocols, protocolNameMap, currentWearable, priorWearable) {
    // Calculate adherence for both weeks
    const currentAdherence = calculateAdherence(currentLogs, enrolledProtocols, protocolNameMap);
    const priorAdherence = calculateAdherence(priorLogs, enrolledProtocols, protocolNameMap);
    // Protocol completed change
    const completedChange = priorLogs.length > 0
        ? currentLogs.length - priorLogs.length
        : null;
    // Adherence change
    const adherenceChange = priorLogs.length > 0
        ? currentAdherence - priorAdherence
        : null;
    // Recovery score change
    const currentRecovery = calculateWearableMetrics(currentWearable).avgRecovery;
    const priorRecovery = calculateWearableMetrics(priorWearable).avgRecovery;
    const recoveryChange = currentRecovery !== null && priorRecovery !== null
        ? currentRecovery - priorRecovery
        : null;
    return {
        protocol_adherence_change: adherenceChange,
        protocols_completed_change: completedChange,
        recovery_score_change: recoveryChange,
    };
}
/**
 * Calculates correlations between protocol completion and outcomes.
 * Uses 30-day lookback for statistical significance.
 */
function calculateCorrelations(logs, wearableData, protocolNameMap) {
    if (logs.length < types_1.SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS || wearableData.length < types_1.SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS) {
        return [];
    }
    // Build daily wearable metrics map
    const dailyMetrics = new Map();
    for (const data of wearableData) {
        const day = data.recorded_at.split('T')[0];
        const existing = dailyMetrics.get(day);
        if (!existing) {
            dailyMetrics.set(day, {
                hrv_score: data.hrv_score,
                sleep_hours: data.sleep_hours,
                recovery_score: data.readiness_score,
                resting_hr: data.resting_hr_bpm,
            });
        }
    }
    // Build daily protocol completion map (protocol_id -> Set of days)
    const protocolDays = new Map();
    for (const log of logs) {
        const day = log.logged_at.split('T')[0];
        const existing = protocolDays.get(log.protocol_id) || new Set();
        existing.add(day);
        protocolDays.set(log.protocol_id, existing);
    }
    // Get all unique days
    const allDays = Array.from(new Set([...dailyMetrics.keys(), ...Array.from(protocolDays.values()).flatMap((s) => Array.from(s))])).sort();
    const correlations = [];
    const outcomes = ['sleep_hours', 'hrv_score', 'recovery_score', 'resting_hr'];
    // Calculate correlation for each protocol-outcome pair
    for (const [protocolId, completedDays] of protocolDays) {
        // Skip if not enough protocol completions
        if (completedDays.size < 3)
            continue;
        for (const outcome of outcomes) {
            // Build paired arrays (protocol completed = 1, not = 0) and outcome values
            const protocolArray = [];
            const outcomeArray = [];
            for (const day of allDays) {
                const metrics = dailyMetrics.get(day);
                const outcomeValue = metrics?.[outcome];
                if (outcomeValue !== null && outcomeValue !== undefined) {
                    protocolArray.push(completedDays.has(day) ? 1 : 0);
                    outcomeArray.push(outcomeValue);
                }
            }
            // Need enough paired data points
            if (protocolArray.length < types_1.SYNTHESIS_CONFIG.MIN_CORRELATION_DAYS)
                continue;
            try {
                const result = (0, correlations_1.pearsonCorrelation)(protocolArray, outcomeArray);
                const { direction, interpretation } = (0, correlations_1.interpretCorrelation)(result.r, outcome);
                correlations.push({
                    protocol: protocolId,
                    protocol_name: protocolNameMap.get(protocolId) || protocolId,
                    outcome,
                    correlation: result.r,
                    p_value: result.p_value,
                    is_significant: result.p_value < types_1.SYNTHESIS_CONFIG.CORRELATION_P_THRESHOLD,
                    sample_size: result.n,
                    direction,
                    interpretation,
                });
            }
            catch (err) {
                // Skip if correlation calculation fails
                console.warn(`[WeeklySynthesis] Correlation calc failed for ${protocolId}/${outcome}:`, err);
            }
        }
    }
    // Sort by significance and correlation strength, limit to top N
    return correlations
        .filter((c) => c.is_significant || Math.abs(c.correlation) > 0.3)
        .sort((a, b) => {
        // Prioritize significant correlations
        if (a.is_significant !== b.is_significant) {
            return a.is_significant ? -1 : 1;
        }
        // Then by absolute correlation strength
        return Math.abs(b.correlation) - Math.abs(a.correlation);
    })
        .slice(0, types_1.SYNTHESIS_CONFIG.MAX_CORRELATIONS);
}
/**
 * Returns the Monday of the week containing the given date.
 */
function getWeekMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
/**
 * Returns the Sunday of the week containing the given date.
 */
function getWeekSunday(date) {
    const monday = getWeekMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return sunday;
}
