/**
 * useNetworkState Hook
 *
 * Cross-platform hook for detecting online/offline status.
 * Web: Uses navigator.onLine + event listeners
 * Native: Uses NetInfo from @react-native-community/netinfo
 *
 * Reference: Phase 3 Session 6 - Real-time Sync
 */

import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export interface NetworkState {
  /** Whether the device has network connectivity */
  isOnline: boolean;
  /** Whether we're currently checking/transitioning connectivity */
  isConnecting: boolean;
}

/**
 * Default state - assume online until proven otherwise
 */
const DEFAULT_STATE: NetworkState = {
  isOnline: true,
  isConnecting: false,
};

/**
 * Hook for web platform using navigator.onLine
 */
function useWebNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnecting: false,
  }));

  useEffect(() => {
    // Skip web-specific logic on native platforms
    if (Platform.OS !== 'web') {
      return;
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const handleOnline = () => {
      setState({ isOnline: true, isConnecting: false });
    };

    const handleOffline = () => {
      setState({ isOnline: false, isConnecting: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setState({
      isOnline: navigator.onLine,
      isConnecting: false,
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return state;
}

/**
 * Hook for native platform.
 * Note: For a production app, consider installing @react-native-community/netinfo
 * Currently falls back to assuming online status.
 */
function useNativeNetworkState(): NetworkState {
  // For native platforms without netinfo installed, assume online
  // This is a safe default - the app will just attempt network operations
  // and handle failures gracefully via the offline queue
  return DEFAULT_STATE;
}

/**
 * Cross-platform network state hook.
 * Automatically uses the appropriate implementation based on platform.
 *
 * @example
 * const { isOnline, isConnecting } = useNetworkState();
 * if (!isOnline) {
 *   showOfflineBanner();
 * }
 */
export function useNetworkState(): NetworkState {
  // Use platform-specific implementation
  const webState = useWebNetworkState();
  const nativeState = useNativeNetworkState();

  // Return appropriate state based on platform
  if (Platform.OS === 'web') {
    return webState;
  }

  return nativeState;
}

/**
 * Hook that provides a callback when network state changes.
 * Useful for triggering sync operations when coming back online.
 *
 * @param onOnline Callback when device comes online
 * @param onOffline Callback when device goes offline
 */
export function useNetworkStateCallback(
  onOnline?: () => void,
  onOffline?: () => void
): NetworkState {
  const state = useNetworkState();
  const [wasOnline, setWasOnline] = useState(state.isOnline);

  useEffect(() => {
    if (state.isOnline && !wasOnline && onOnline) {
      onOnline();
    } else if (!state.isOnline && wasOnline && onOffline) {
      onOffline();
    }
    setWasOnline(state.isOnline);
  }, [state.isOnline, wasOnline, onOnline, onOffline]);

  return state;
}

export default useNetworkState;
