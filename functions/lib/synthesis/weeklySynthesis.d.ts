/**
 * Weekly Synthesis Aggregation
 *
 * Aggregates user metrics for weekly synthesis generation.
 * Queries protocol logs, wearable data, and calculates correlations.
 *
 * Reference: PHASE_II_IMPLEMENTATION_PLAN.md - Component 5
 */
import { WeeklyMetrics } from './types';
/**
 * Aggregates all weekly metrics for a user within a date range.
 *
 * @param userId - Supabase user UUID
 * @param weekStart - Start of week (Monday) as Date or ISO string
 * @param weekEnd - End of week (Sunday) as Date or ISO string
 * @returns Complete WeeklyMetrics object
 */
export declare function aggregateWeeklyMetrics(userId: string, weekStart: Date | string, weekEnd: Date | string): Promise<WeeklyMetrics>;
/**
 * Returns the Monday of the week containing the given date.
 */
export declare function getWeekMonday(date: Date): Date;
/**
 * Returns the Sunday of the week containing the given date.
 */
export declare function getWeekSunday(date: Date): Date;
