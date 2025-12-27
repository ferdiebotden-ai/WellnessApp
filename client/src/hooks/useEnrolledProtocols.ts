import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { fetchEnrolledProtocols, EnrolledProtocol } from '../services/api';

/**
 * Extended protocol with local timezone display and status indicators.
 */
export interface ScheduledProtocol extends EnrolledProtocol {
  /** Local time display string (e.g., "7:00 AM") */
  localTime: string;
  /** Date object for today at the scheduled local time (for comparisons) */
  localTimeDate: Date;
  /** True if protocol is due within ±15 minutes */
  isDueNow: boolean;
  /** True if protocol is upcoming within 15-60 minutes */
  isUpcoming: boolean;
  /** Minutes until scheduled time (null if already passed) */
  minutesUntil: number | null;
}

/**
 * Converts UTC time string "HH:MM" to local Date object for today.
 * Returns a Date object set to today's date at the specified UTC time,
 * which JS automatically converts to local timezone.
 */
const utcTimeToLocalDate = (utcTime: string): Date => {
  const [hours, minutes] = utcTime.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    // Fallback to noon if invalid format
    return new Date();
  }

  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  ));
  return utcDate;
};

/**
 * Formats a Date to local time string (e.g., "7:00 AM").
 */
const formatLocalTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
};

/**
 * Calculates minutes until a scheduled time from now.
 * Returns negative if time has passed, positive if in future.
 */
const getMinutesUntil = (scheduledTime: Date): number => {
  const now = new Date();
  const diffMs = scheduledTime.getTime() - now.getTime();
  return Math.round(diffMs / 60000);
};

/**
 * Hook to fetch and transform enrolled protocols with local timezone
 * conversion and status indicators (due now, upcoming).
 *
 * @returns {Object} protocols, loading, error, refresh
 */
/** Default interval for status recalculation (60 seconds) */
const STATUS_REFRESH_INTERVAL = 60000;

export const useEnrolledProtocols = () => {
  const [rawProtocols, setRawProtocols] = useState<EnrolledProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tick counter triggers useMemo recalculation without API call
  const [tick, setTick] = useState(0);
  const appStateRef = useRef(AppState.currentState);

  const fetchProtocols = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEnrolledProtocols();
      // MVP-005: Deduplicate by protocol_id to prevent duplicate cards on home screen
      // Keeps the first enrollment if somehow multiple exist for same protocol
      const deduped = Array.from(
        new Map(data.map(p => [p.protocol_id, p])).values()
      );
      setRawProtocols(deduped);
    } catch (err) {
      console.error('[useEnrolledProtocols] Fetch failed:', err);
      setError('Failed to load your schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProtocols();
  }, [fetchProtocols]);

  // Auto-refresh status every minute (recalculates isDueNow, isUpcoming without API call)
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, STATUS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - recalculate status immediately
        setTick(t => t + 1);
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  // Transform raw protocols with local time and status
  const protocols = useMemo((): ScheduledProtocol[] => {
    const now = new Date();

    return rawProtocols
      .map((protocol): ScheduledProtocol => {
        const localTimeDate = utcTimeToLocalDate(protocol.default_time_utc);
        const localTime = formatLocalTime(localTimeDate);
        const minutesUntil = getMinutesUntil(localTimeDate);

        // Due now: within ±15 minutes of scheduled time
        const isDueNow = minutesUntil >= -15 && minutesUntil <= 15;

        // Upcoming: 15-60 minutes away (but not due now)
        const isUpcoming = minutesUntil > 15 && minutesUntil <= 60;

        return {
          ...protocol,
          localTime,
          localTimeDate,
          isDueNow,
          isUpcoming,
          minutesUntil: minutesUntil > 0 ? minutesUntil : null,
        };
      })
      // Sort by scheduled time (earliest first)
      .sort((a, b) => a.localTimeDate.getTime() - b.localTimeDate.getTime());
  }, [rawProtocols, tick]); // tick triggers recalculation without API call

  return {
    protocols,
    loading,
    error,
    refresh: fetchProtocols,
  };
};
