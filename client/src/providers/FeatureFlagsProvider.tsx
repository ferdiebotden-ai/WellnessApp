import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { featureFlags, FEATURE_FLAG_KEYS } from '../services/featureFlags';

interface FeatureFlagsContextValue {
  /**
   * Whether feature flags are still loading.
   */
  loading: boolean;

  /**
   * Whether a module is enabled.
   */
  isModuleEnabled: (moduleId: string) => boolean;

  /**
   * Whether AI chat is enabled.
   */
  isAiChatEnabled: () => boolean;

  /**
   * Get a feature flag value by key.
   */
  getFlag: (key: string) => boolean;

  /**
   * Manually refresh feature flags from remote config.
   */
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes and manages feature flags.
 * Wraps the app to provide feature flag context to all components.
 */
export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeFlags = async () => {
      try {
        await featureFlags.initialize();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize feature flags', error);
        // Continue with defaults if initialization fails
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    void initializeFlags();
  }, []);

  const isModuleEnabled = useCallback(
    (moduleId: string): boolean => {
      if (!initialized) {
        return true; // Default to enabled during loading
      }
      return featureFlags.isModuleEnabled(moduleId);
    },
    [initialized]
  );

  const isAiChatEnabled = useCallback((): boolean => {
    if (!initialized) {
      return true; // Default to enabled during loading
    }
    return featureFlags.isAiChatEnabled();
  }, [initialized]);

  const getFlag = useCallback(
    (key: string): boolean => {
      if (!initialized) {
        return true; // Default to enabled during loading
      }
      return featureFlags.getBoolean(key, true);
    },
    [initialized]
  );

  const refresh = useCallback(async (): Promise<void> => {
    await featureFlags.refresh();
  }, []);

  const value: FeatureFlagsContextValue = {
    loading,
    isModuleEnabled,
    isAiChatEnabled,
    getFlag,
    refresh,
  };

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

/**
 * Hook to access feature flags context.
 * @throws Error if used outside FeatureFlagsProvider
 */
export const useFeatureFlags = (): FeatureFlagsContextValue => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }
  return context;
};

