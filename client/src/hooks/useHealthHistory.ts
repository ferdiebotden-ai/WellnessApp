/**
 * useHealthHistory Hook
 *
 * Fetches historical health data for trend charts.
 * Supports 7-day and 30-day views.
 *
 * Initially uses mock data; will be connected to
 * GET /api/health/history endpoint in Phase 4.
 *
 * @file client/src/hooks/useHealthHistory.ts
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { firebaseAuth } from '../services/firebase';

// =============================================================================
// TYPES
// =============================================================================

export interface DayMetrics {
  date: string; // YYYY-MM-DD
  sleep: {
    durationHours: number | null;
    efficiency: number | null;
    deepPct: number | null;
    remPct: number | null;
  };
  hrv: {
    avg: number | null;
    method: 'rmssd' | 'sdnn' | null;
  };
  rhr: {
    avg: number | null;
  };
  steps: number | null;
  activeCalories: number | null;
  recoveryScore: number | null;
}

export interface HealthHistoryResponse {
  days: DayMetrics[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface UseHealthHistoryOptions {
  /** Number of days to fetch (7, 14, or 30) */
  days?: 7 | 14 | 30;
  /** Whether to use mock data (for development) */
  useMockData?: boolean;
}

export interface UseHealthHistoryReturn {
  /** Historical health data */
  data: HealthHistoryResponse | null;
  /** Whether data is loading */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Transform data for specific metric chart */
  getMetricData: (metric: 'sleep' | 'hrv' | 'rhr' | 'steps' | 'recovery') => ChartData[];
}

export interface ChartData {
  date: string;
  value: number | null;
  label?: string;
}

// =============================================================================
// MOCK DATA GENERATOR
// =============================================================================

function generateMockData(days: number): HealthHistoryResponse {
  const data: DayMetrics[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Generate realistic-looking mock data with some variation
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Sleep tends to be better on weekends
    const baseSleep = isWeekend ? 7.5 : 6.8;
    const sleepVariation = (Math.random() - 0.5) * 1.5;
    const sleepHours = Math.max(4, Math.min(10, baseSleep + sleepVariation));

    // HRV varies inversely with stress (lower on weekdays)
    const baseHrv = isWeekend ? 52 : 45;
    const hrvVariation = (Math.random() - 0.5) * 20;
    const hrv = Math.max(20, Math.min(80, baseHrv + hrvVariation));

    // RHR typically slightly higher on active days
    const baseRhr = 58;
    const rhrVariation = (Math.random() - 0.5) * 10;
    const rhr = Math.max(45, Math.min(75, baseRhr + rhrVariation));

    // Steps vary significantly
    const baseSteps = isWeekend ? 8000 : 6000;
    const stepsVariation = (Math.random() - 0.5) * 6000;
    const steps = Math.max(1000, Math.round(baseSteps + stepsVariation));

    // Recovery correlates with sleep and HRV
    const recoveryBase = (sleepHours / 8) * 40 + (hrv / 60) * 30 + (1 - rhr / 70) * 30;
    const recoveryScore = Math.max(20, Math.min(100, Math.round(recoveryBase + (Math.random() - 0.5) * 15)));

    data.push({
      date: dateStr,
      sleep: {
        durationHours: Math.round(sleepHours * 10) / 10,
        efficiency: Math.round(75 + Math.random() * 20),
        deepPct: Math.round(15 + Math.random() * 15),
        remPct: Math.round(18 + Math.random() * 12),
      },
      hrv: {
        avg: Math.round(hrv),
        method: 'rmssd',
      },
      rhr: {
        avg: Math.round(rhr),
      },
      steps: steps,
      activeCalories: Math.round(steps * 0.04 + 200 + Math.random() * 300),
      recoveryScore: recoveryScore,
    });
  }

  return {
    days: data,
    dateRange: {
      start: data[0].date,
      end: data[data.length - 1].date,
    },
  };
}

// =============================================================================
// HOOK
// =============================================================================

export function useHealthHistory(options: UseHealthHistoryOptions = {}): UseHealthHistoryReturn {
  const { days = 7, useMockData = true } = options;
  const userId = firebaseAuth.currentUser?.uid ?? null;

  const [data, setData] = useState<HealthHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (useMockData) {
        // Use mock data for now
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockData = generateMockData(days);
        setData(mockData);
      } else {
        // Real API call (Phase 4)
        const token = await firebaseAuth.currentUser?.getIdToken();
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/api/health/history?days=${days}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch health history: ${response.status}`);
        }

        const result: HealthHistoryResponse = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error('[useHealthHistory] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch health history');
      // Fall back to mock data on error
      const mockData = generateMockData(days);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [userId, days, useMockData]);

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform data for specific metric chart
  const getMetricData = useCallback((metric: 'sleep' | 'hrv' | 'rhr' | 'steps' | 'recovery'): ChartData[] => {
    if (!data?.days) return [];

    return data.days.map(day => {
      let value: number | null = null;

      switch (metric) {
        case 'sleep':
          value = day.sleep.durationHours;
          break;
        case 'hrv':
          value = day.hrv.avg;
          break;
        case 'rhr':
          value = day.rhr.avg;
          break;
        case 'steps':
          value = day.steps;
          break;
        case 'recovery':
          value = day.recoveryScore;
          break;
      }

      return {
        date: day.date,
        value,
        label: new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      };
    });
  }, [data]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    getMetricData,
  };
}

export default useHealthHistory;
