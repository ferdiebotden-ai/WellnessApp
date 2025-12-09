/**
 * useTodaysFocus
 *
 * Hook to select the "One Big Thing" - the highest priority protocol for today.
 * Based on MVD logic and recovery zone filtering.
 *
 * @file client/src/hooks/useTodaysFocus.ts
 */

import { useMemo } from 'react';
import type { DashboardTask } from '../types/dashboard';
import type { RecoveryZone } from '../components/RecoveryScoreCard';

export interface TodaysFocus {
  /** The selected protocol/task */
  task: DashboardTask;
  /** Why this protocol was selected */
  reason: string;
  /** Personalized context from user data */
  personalizedContext?: string;
  /** Protocol duration in minutes */
  duration?: number;
}

interface UseTodaysFocusOptions {
  /** All tasks from useTaskFeed */
  tasks: DashboardTask[];
  /** Current recovery zone (affects MVD filtering) */
  recoveryZone?: RecoveryZone | null;
  /** Recovery score (0-100) */
  recoveryScore?: number | null;
}

interface UseTodaysFocusResult {
  /** The selected focus task, or null if none */
  focus: TodaysFocus | null;
  /** Whether the user is in MVD (Minimum Viable Day) mode */
  isMVD: boolean;
}

/**
 * MVD (Minimum Viable Day) protocols - shown when recovery is red
 */
const MVD_PROTOCOLS = ['morning light', 'hydration', 'sleep', 'bedtime'];

/**
 * Check if a task is an MVD-eligible protocol
 */
const isMVDProtocol = (task: DashboardTask): boolean => {
  const titleLower = task.title.toLowerCase();
  return MVD_PROTOCOLS.some((mvd) => titleLower.includes(mvd));
};

/**
 * Get the priority score for a task (higher = more important)
 */
const getTaskPriority = (task: DashboardTask): number => {
  const titleLower = task.title.toLowerCase();

  // Morning protocols get highest priority in morning
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;

  let priority = 0;

  // Base priority by emphasis
  if (task.emphasis === 'high') priority += 100;
  if (task.emphasis === 'medium') priority += 50;

  // Morning light is highest priority in morning
  if (titleLower.includes('morning light') && isMorning) priority += 200;

  // Scheduled tasks with specific times get priority
  if (task.scheduledAt) {
    const now = new Date();
    const diff = task.scheduledAt.getTime() - now.getTime();
    const hoursUntil = diff / (1000 * 60 * 60);

    // Tasks coming up in the next 2 hours get priority boost
    if (hoursUntil >= 0 && hoursUntil <= 2) priority += 150;
    // Tasks in the past but not too old (last 2 hours) still relevant
    if (hoursUntil < 0 && hoursUntil >= -2) priority += 75;
  }

  // Nudges from AI get slight boost
  if (task.source === 'nudge') priority += 25;

  return priority;
};

/**
 * Get reason text based on task characteristics
 */
const getReasonForTask = (task: DashboardTask, isMVD: boolean): string => {
  const titleLower = task.title.toLowerCase();

  if (isMVD) {
    if (titleLower.includes('morning light')) {
      return 'Foundation protocol for circadian rhythm';
    }
    if (titleLower.includes('hydration')) {
      return 'Essential for recovery day';
    }
    if (titleLower.includes('sleep') || titleLower.includes('bedtime')) {
      return 'Prioritize rest to recover faster';
    }
    return 'Focus on essentials today';
  }

  if (titleLower.includes('morning light')) {
    return 'Start your day with circadian optimization';
  }
  if (titleLower.includes('cold')) {
    return 'Boost alertness and HRV';
  }
  if (titleLower.includes('breath')) {
    return 'Activate parasympathetic recovery';
  }
  if (titleLower.includes('caffeine')) {
    return 'Optimize adenosine timing';
  }

  return 'AI-selected based on your schedule';
};

export const useTodaysFocus = ({
  tasks,
  recoveryZone,
  recoveryScore,
}: UseTodaysFocusOptions): UseTodaysFocusResult => {
  const result = useMemo(() => {
    // Filter to pending tasks only
    const pendingTasks = tasks.filter((task) => task.status === 'pending');

    if (pendingTasks.length === 0) {
      return { focus: null, isMVD: false };
    }

    // Determine if in MVD mode (red zone or score < 40)
    const isMVD = recoveryZone === 'red' || (recoveryScore !== null && recoveryScore !== undefined && recoveryScore < 40);

    // Filter tasks based on MVD mode
    let eligibleTasks = pendingTasks;
    if (isMVD) {
      const mvdTasks = pendingTasks.filter(isMVDProtocol);
      // Only use MVD filter if we have MVD tasks
      if (mvdTasks.length > 0) {
        eligibleTasks = mvdTasks;
      }
    }

    // Sort by priority
    const sortedTasks = [...eligibleTasks].sort(
      (a, b) => getTaskPriority(b) - getTaskPriority(a)
    );

    const topTask = sortedTasks[0];
    if (!topTask) {
      return { focus: null, isMVD };
    }

    // Extract duration from title if present (e.g., "10 min")
    const durationMatch = topTask.title.match(/(\d+)\s*min/i);
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : undefined;

    const focus: TodaysFocus = {
      task: topTask,
      reason: getReasonForTask(topTask, isMVD),
      duration,
      personalizedContext: topTask.whyExpansion?.your_data,
    };

    return { focus, isMVD };
  }, [tasks, recoveryZone, recoveryScore]);

  return result;
};

export default useTodaysFocus;
