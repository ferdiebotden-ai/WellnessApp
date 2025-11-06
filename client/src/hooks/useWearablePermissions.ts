import { useEffect, useRef, useState } from 'react';
import type { WearablePermissionResult } from '../services/wearables/aggregators';
import { requestWearablePermissions } from '../services/wearables/aggregators';

export interface UseWearablePermissionsOptions {
  shouldPrompt: boolean;
  enabled?: boolean;
}

const createUnavailableResult = (): WearablePermissionResult => ({ status: 'unavailable' });

/**
 * Hook that defers the wearable permission request until after the user's first milestone.
 * This ensures the integration is introduced contextually (e.g., post "First Win")
 * instead of during onboarding.
 */
export const useWearablePermissions = (
  options: UseWearablePermissionsOptions
): WearablePermissionResult => {
  const { shouldPrompt, enabled = true } = options;
  const [result, setResult] = useState<WearablePermissionResult>(createUnavailableResult);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !shouldPrompt || hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;

    requestWearablePermissions()
      .then((permissionResult) => {
        setResult(permissionResult);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to request wearable permissions';
        setResult({ status: 'denied', error: message });
      });
  }, [enabled, shouldPrompt]);

  return result;
};

export default useWearablePermissions;
