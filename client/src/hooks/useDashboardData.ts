import { useState, useEffect, useCallback } from 'react';
import { fetchCurrentUser } from '../services/api';
import type { HealthMetric, ModuleEnrollment } from '../types/dashboard';

const MODULE_METADATA: Record<string, { title: string; focusArea: string; tier: 'core' | 'pro' }> = {
  'sleep-optimization': { title: 'Sleep Optimization', focusArea: 'Deep sleep extension', tier: 'core' },
  'morning-routine': { title: 'Morning Routine', focusArea: 'Circadian alignment', tier: 'core' },
  'focus-productivity': { title: 'Focus & Productivity', focusArea: 'Deep work', tier: 'core' },
  'stress-regulation': { title: 'Stress & Emotional Regulation', focusArea: 'Nervous system', tier: 'pro' },
  'energy-recovery': { title: 'Energy & Recovery', focusArea: 'Metabolic health', tier: 'pro' },
  'dopamine-hygiene': { title: 'Dopamine Hygiene', focusArea: 'Digital balance', tier: 'pro' },
};

export const useDashboardData = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [enrollments, setEnrollments] = useState<ModuleEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const response = await fetchCurrentUser();

      // Defensive: Validate response structure
      if (!response || typeof response !== 'object') {
        console.warn('[useDashboardData] Invalid API response format');
        return;
      }

      const { user } = response;

      // Defensive: Validate user object exists
      if (!user || typeof user !== 'object') {
        console.warn('[useDashboardData] No user object in response');
        return;
      }

      // Transform metrics
      const userMetrics: HealthMetric[] = [];
      // Default mock metrics if none exist (to keep UI populated for MVP)
      if (!user.healthMetrics || typeof user.healthMetrics !== 'object' || Object.keys(user.healthMetrics).length === 0) {
         userMetrics.push(
          { id: 'sleep', label: 'Sleep Quality', valueLabel: '--', trend: 'steady', progress: 0 },
          { id: 'hrv', label: 'HRV Readiness', valueLabel: '--', trend: 'steady', progress: 0 }
         );
      } else {
        // Map actual metrics here
        // This assumes backend populates these fields.
        if (user.healthMetrics.sleepQuality) {
             userMetrics.push({
               id: 'sleep',
               label: 'Sleep Quality',
               valueLabel: `${user.healthMetrics.sleepQuality}%`,
               trend: 'steady',
               progress: (user.healthMetrics.sleepQuality as number) / 100
             });
        }
         if (user.healthMetrics.hrv) {
             userMetrics.push({
               id: 'hrv',
               label: 'HRV Readiness',
               valueLabel: `${user.healthMetrics.hrv} ms`,
               trend: 'steady',
               progress: 0.5 // Placeholder normalization
             });
        }
      }
      setMetrics(userMetrics);

      // Transform enrollments - Defensive: verify module_enrollment is an array
      if (user.module_enrollment && Array.isArray(user.module_enrollment)) {
        const userEnrollments = user.module_enrollment.map(e => {
          // Defensive: ensure each enrollment has required fields
          const moduleId = e?.module_id ?? 'unknown';
          const meta = MODULE_METADATA[moduleId] || { title: moduleId, focusArea: 'Wellness', tier: 'core' as const };
          return {
            id: moduleId,
            title: meta.title,
            progressPct: e?.progress_pct ?? 0,
            currentStreak: e?.current_streak ?? 0,
            focusArea: meta.focusArea,
            tier: meta.tier
          };
        });
        setEnrollments(userEnrollments);
      }
    } catch (error) {
      console.warn('[useDashboardData] Failed to load dashboard data:', error);
      // Don't rethrow - let component render with empty data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return { metrics, enrollments, loading, reload: loadData };
};

