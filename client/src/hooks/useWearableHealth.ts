/**
 * useWearableHealth Hook
 *
 * Platform-agnostic wrapper that automatically selects the appropriate
 * health data provider based on the current platform:
 * - iOS: Uses HealthKit via useHealthKit hook
 * - Android: Uses Health Connect via useHealthConnect hook
 * - Web/Other: Returns unavailable status
 *
 * This hook provides a unified interface for health data sync across platforms,
 * allowing components to work with wearable data without platform-specific logic.
 *
 * @example
 * ```tsx
 * function RecoveryDashboard() {
 *   const {
 *     isAvailable,
 *     status,
 *     syncNow,
 *     latestReadings,
 *     platform,
 *   } = useWearableHealth();
 *
 *   // Works on both iOS and Android!
 *   if (!isAvailable) {
 *     return <LiteModeScoreCard />;
 *   }
 *
 *   return <RecoveryScoreCard readings={latestReadings} />;
 * }
 * ```
 *
 * @file client/src/hooks/useWearableHealth.ts
 * @author Claude Opus 4.5 (Session 50)
 * @created December 5, 2025
 */

import { Platform } from 'react-native';

import { useHealthKit, UseHealthKitReturn } from './useHealthKit';
import { useHealthConnect, UseHealthConnectReturn } from './useHealthConnect';
import type { HealthKitReading } from '../../../modules/expo-healthkit-observer/src/types';
import type { HealthConnectReading } from '../types/healthConnect';

// =============================================================================
// UNIFIED TYPES
// =============================================================================

/**
 * Platform identifier for the current health data source.
 */
export type WearablePlatform = 'ios' | 'android' | 'web' | 'unknown';

/**
 * Unified health reading type that works across platforms.
 * Combines HealthKitReading and HealthConnectReading fields.
 */
export type UnifiedHealthReading = HealthKitReading | HealthConnectReading;

/**
 * Unified authorization status across platforms.
 */
export type UnifiedAuthorizationStatus =
  | 'authorized'
  | 'denied'
  | 'notDetermined'
  | 'unavailable'
  | 'permanentlyDenied' // Android-specific
  | 'unknown';

/**
 * Return type for the unified wearable health hook.
 */
export interface UseWearableHealthReturn {
  /** Current platform */
  platform: WearablePlatform;
  /** Whether health data is available on this device */
  isAvailable: boolean;
  /** Current authorization status */
  status: UnifiedAuthorizationStatus;
  /** Whether the hook is loading */
  isLoading: boolean;
  /** Request health data permissions */
  requestPermission: () => Promise<boolean>;
  /** Manually trigger a sync */
  syncNow: () => Promise<UnifiedHealthReading[]>;
  /** Whether a sync is in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncAt: Date | null;
  /** Latest readings from last sync */
  latestReadings: UnifiedHealthReading[];
  /** Error message if any operation failed */
  error: string | null;

  // iOS-specific (available when platform === 'ios')
  /** Enable background delivery (iOS only) */
  enableBackgroundDelivery?: () => Promise<boolean>;
  /** Disable background delivery (iOS only) */
  disableBackgroundDelivery?: () => Promise<void>;
  /** Whether background delivery is enabled (iOS only) */
  isBackgroundEnabled?: boolean;
}

// =============================================================================
// FALLBACK HOOK
// =============================================================================

/**
 * Fallback hook for non-mobile platforms.
 * Returns unavailable status with no-op functions.
 */
function useUnavailableHealth(): UseWearableHealthReturn {
  return {
    platform: Platform.OS === 'web' ? 'web' : 'unknown',
    isAvailable: false,
    status: 'unavailable',
    isLoading: false,
    requestPermission: async () => false,
    syncNow: async () => [],
    isSyncing: false,
    lastSyncAt: null,
    latestReadings: [],
    error: null,
  };
}

// =============================================================================
// PLATFORM-SPECIFIC ADAPTERS
// =============================================================================

/**
 * Adapts iOS HealthKit hook to unified interface.
 */
function adaptHealthKit(hook: UseHealthKitReturn): UseWearableHealthReturn {
  return {
    platform: 'ios',
    isAvailable: hook.isAvailable,
    status: hook.status,
    isLoading: hook.isLoading,
    requestPermission: hook.requestPermission,
    syncNow: hook.syncNow,
    isSyncing: hook.isSyncing,
    lastSyncAt: hook.lastSyncAt,
    latestReadings: hook.latestReadings,
    error: hook.error,
    // iOS-specific features
    enableBackgroundDelivery: hook.enableBackgroundDelivery,
    disableBackgroundDelivery: hook.disableBackgroundDelivery,
    isBackgroundEnabled: hook.isBackgroundEnabled,
  };
}

/**
 * Adapts Android Health Connect hook to unified interface.
 */
function adaptHealthConnect(
  hook: UseHealthConnectReturn
): UseWearableHealthReturn {
  return {
    platform: 'android',
    isAvailable: hook.isAvailable,
    status: hook.status,
    isLoading: hook.isLoading,
    requestPermission: hook.requestPermission,
    syncNow: hook.syncNow,
    isSyncing: hook.isSyncing,
    lastSyncAt: hook.lastSyncAt,
    latestReadings: hook.latestReadings,
    error: hook.error,
    // No background delivery on Android (foreground-only for MVP)
  };
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Platform-agnostic hook for wearable health data.
 *
 * Automatically selects the appropriate health data provider:
 * - iOS: HealthKit
 * - Android: Health Connect
 * - Other: Unavailable fallback
 */
export function useWearableHealth(): UseWearableHealthReturn {
  const platform = Platform.OS;

  // Use platform-specific hooks
  // Note: Hooks must be called unconditionally, but we only use the result
  // for the current platform
  const healthKitResult = useHealthKit();
  const healthConnectResult = useHealthConnect();

  // Return appropriate result based on platform
  if (platform === 'ios') {
    return adaptHealthKit(healthKitResult);
  } else if (platform === 'android') {
    return adaptHealthConnect(healthConnectResult);
  } else {
    return useUnavailableHealth();
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the wearable source identifier for backend sync.
 */
export function getWearableSource(): 'apple_health' | 'health_connect' | null {
  const platform = Platform.OS;
  if (platform === 'ios') return 'apple_health';
  if (platform === 'android') return 'health_connect';
  return null;
}

/**
 * Check if the current platform supports wearable health data.
 */
export function isPlatformSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Get a user-friendly name for the health data provider.
 */
export function getProviderName(): string {
  const platform = Platform.OS;
  if (platform === 'ios') return 'Apple Health';
  if (platform === 'android') return 'Health Connect';
  return 'Health Data';
}

export default useWearableHealth;
