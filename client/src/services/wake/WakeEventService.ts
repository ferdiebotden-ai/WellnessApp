/**
 * Wake Event Service (Client-side)
 *
 * API client for sending wake events to the backend and triggering Morning Anchor.
 *
 * @file client/src/services/wake/WakeEventService.ts
 * @author Claude Opus 4.5 (Session 42)
 * @created December 5, 2025
 */

import { getAuth } from 'firebase/auth';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Wake event source types.
 */
export type WakeSource = 'healthkit' | 'phone_unlock' | 'manual';

/**
 * Input for sending a wake event.
 */
export interface SendWakeEventInput {
  source: WakeSource;
  wakeTime: Date;
  sleepStartTime?: Date;
  userConfirmedAt?: Date;
}

/**
 * Response from the wake events API.
 */
export interface WakeEventResponse {
  success: boolean;
  wake_event_id?: string;
  detected?: boolean;
  detection_method?: string;
  confidence?: number;
  wake_time?: string;
  morning_anchor_triggered?: boolean;
  morning_anchor_skipped?: boolean;
  skip_reason?: string;
  nudge_id?: string;
  scheduled_for?: string;
  already_exists?: boolean;
  message?: string;
  error?: string;
}

/**
 * Today's wake event from the API.
 */
export interface TodayWakeEventResponse {
  found: boolean;
  wake_event?: {
    id: string;
    date: string;
    wake_time: string;
    detection_method: string;
    confidence: number;
    morning_anchor_triggered_at?: string;
    morning_anchor_skipped: boolean;
    skip_reason?: string;
  };
  message?: string;
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * API base URL.
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api-26324650924.us-central1.run.app';

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class WakeEventService {
  /**
   * Send a wake event to the backend.
   *
   * @param input - Wake event details
   * @returns API response
   */
  async sendWakeEvent(input: SendWakeEventInput): Promise<WakeEventResponse> {
    const token = await this.getAuthToken();
    if (!token) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    const timezone = this.getUserTimezone();

    const body = {
      source: input.source,
      wake_time: input.wakeTime.toISOString(),
      sleep_start_time: input.sleepStartTime?.toISOString(),
      user_confirmed_at: input.userConfirmedAt?.toISOString(),
      timezone,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/wake-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return data as WakeEventResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Network error: ${message}`,
      };
    }
  }

  /**
   * Get today's wake event (if any).
   *
   * @returns Today's wake event or null
   */
  async getTodayWakeEvent(): Promise<TodayWakeEventResponse> {
    const token = await this.getAuthToken();
    if (!token) {
      return {
        found: false,
        error: 'Not authenticated',
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/wake-events/today`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data as TodayWakeEventResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        found: false,
        error: `Network error: ${message}`,
      };
    }
  }

  /**
   * Check if Morning Anchor has already been triggered today.
   *
   * @returns True if Morning Anchor was already triggered
   */
  async hasMorningAnchorTriggeredToday(): Promise<boolean> {
    const response = await this.getTodayWakeEvent();

    if (!response.found || !response.wake_event) {
      return false;
    }

    return !!response.wake_event.morning_anchor_triggered_at;
  }

  /**
   * Send wake event from HealthKit detection.
   */
  async sendHealthKitWake(wakeTime: Date, sleepStartTime?: Date): Promise<WakeEventResponse> {
    return this.sendWakeEvent({
      source: 'healthkit',
      wakeTime,
      sleepStartTime,
    });
  }

  /**
   * Send wake event from phone unlock detection.
   *
   * @param unlockTime - Time of first unlock
   * @param userConfirmed - Whether user confirmed via overlay
   */
  async sendPhoneUnlockWake(
    unlockTime: Date,
    userConfirmed: boolean = false
  ): Promise<WakeEventResponse> {
    return this.sendWakeEvent({
      source: 'phone_unlock',
      wakeTime: unlockTime,
      userConfirmedAt: userConfirmed ? new Date() : undefined,
    });
  }

  /**
   * Send wake event from manual user input.
   */
  async sendManualWake(wakeTime: Date): Promise<WakeEventResponse> {
    return this.sendWakeEvent({
      source: 'manual',
      wakeTime,
    });
  }

  /**
   * Get the current Firebase auth token.
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      console.warn('[WakeEventService] Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Get the user's timezone.
   */
  private getUserTimezone(): string {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

let serviceInstance: WakeEventService | null = null;

export function getWakeEventService(): WakeEventService {
  if (!serviceInstance) {
    serviceInstance = new WakeEventService();
  }
  return serviceInstance;
}

export default WakeEventService;
