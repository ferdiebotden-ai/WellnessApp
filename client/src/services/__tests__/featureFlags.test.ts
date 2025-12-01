import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { featureFlags, FEATURE_FLAG_KEYS } from '../featureFlags';
import * as firebaseRemoteConfig from 'firebase/remote-config';

// Mock Firebase Remote Config
jest.mock('firebase/remote-config', () => ({
  getRemoteConfig: jest.fn(),
  getValue: jest.fn(),
}));

// Mock Firebase app
jest.mock('../firebase', () => ({
  getFirebaseApp: jest.fn(() => ({})),
}));

describe('FeatureFlagService', () => {
  let mockRemoteConfig: {
    defaultConfig: Record<string, boolean>;
    settings: { minimumFetchIntervalMillis: number };
    fetchAndActivate: jest.Mock;
    ensureInitialized: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRemoteConfig = {
      defaultConfig: {},
      settings: { minimumFetchIntervalMillis: 0 },
      fetchAndActivate: jest.fn().mockResolvedValue(true),
      ensureInitialized: jest.fn().mockResolvedValue(undefined),
    };

    (firebaseRemoteConfig.getRemoteConfig as jest.Mock).mockReturnValue(mockRemoteConfig);
    (firebaseRemoteConfig.getValue as jest.Mock).mockImplementation((_config: unknown, key: string) => ({
      asBoolean: () => mockRemoteConfig.defaultConfig[key] ?? true,
    }));
  });

  describe('initialize', () => {
    it('initializes remote config with default values', async () => {
      await featureFlags.initialize();

      expect(firebaseRemoteConfig.getRemoteConfig).toHaveBeenCalled();
      expect(mockRemoteConfig.defaultConfig).toEqual({
        [FEATURE_FLAG_KEYS.MODULE_SLEEP]: true,
        [FEATURE_FLAG_KEYS.MODULE_MORNING]: true,
        [FEATURE_FLAG_KEYS.MODULE_FOCUS]: true,
        [FEATURE_FLAG_KEYS.MODULE_STRESS]: true,
        [FEATURE_FLAG_KEYS.MODULE_ENERGY]: true,
        [FEATURE_FLAG_KEYS.MODULE_DOPAMINE]: true,
        [FEATURE_FLAG_KEYS.AI_CHAT]: true,
      });
    });

    it('sets cache expiration to 12 hours', async () => {
      await featureFlags.initialize();

      expect(mockRemoteConfig.settings.minimumFetchIntervalMillis).toBe(12 * 60 * 60 * 1000);
    });

    it('handles initialization errors gracefully', async () => {
      mockRemoteConfig.ensureInitialized.mockRejectedValueOnce(new Error('Network error'));

      await featureFlags.initialize();

      // Should still mark as initialized to allow defaults
      expect(featureFlags.getBoolean(FEATURE_FLAG_KEYS.AI_CHAT)).toBe(true);
    });
  });

  describe('getBoolean', () => {
    it('returns default value when not initialized', () => {
      const value = featureFlags.getBoolean(FEATURE_FLAG_KEYS.AI_CHAT, false);
      expect(value).toBe(true); // Uses default from DEFAULT_FLAGS
    });

    it('returns flag value when initialized', async () => {
      await featureFlags.initialize();
      mockRemoteConfig.defaultConfig[FEATURE_FLAG_KEYS.AI_CHAT] = false;

      const value = featureFlags.getBoolean(FEATURE_FLAG_KEYS.AI_CHAT);
      expect(value).toBe(false);
    });

    it('falls back to default when flag not found', async () => {
      await featureFlags.initialize();

      const value = featureFlags.getBoolean('nonexistent_flag', false);
      expect(value).toBe(false);
    });
  });

  describe('isModuleEnabled', () => {
    beforeEach(async () => {
      await featureFlags.initialize();
    });

    it('maps sleep module correctly', () => {
      mockRemoteConfig.defaultConfig[FEATURE_FLAG_KEYS.MODULE_SLEEP] = false;
      expect(featureFlags.isModuleEnabled('sleep')).toBe(false);
    });

    it('maps stress module correctly', () => {
      mockRemoteConfig.defaultConfig[FEATURE_FLAG_KEYS.MODULE_STRESS] = false;
      expect(featureFlags.isModuleEnabled('stress')).toBe(false);
      expect(featureFlags.isModuleEnabled('resilience')).toBe(false);
    });

    it('maps energy module correctly', () => {
      mockRemoteConfig.defaultConfig[FEATURE_FLAG_KEYS.MODULE_ENERGY] = false;
      expect(featureFlags.isModuleEnabled('energy')).toBe(false);
      expect(featureFlags.isModuleEnabled('recovery')).toBe(false);
    });

    it('defaults to enabled for unmapped modules', () => {
      expect(featureFlags.isModuleEnabled('unknown_module')).toBe(true);
    });
  });

  describe('isAiChatEnabled', () => {
    it('returns true by default', async () => {
      await featureFlags.initialize();
      expect(featureFlags.isAiChatEnabled()).toBe(true);
    });

    it('returns false when flag is disabled', async () => {
      await featureFlags.initialize();
      mockRemoteConfig.defaultConfig[FEATURE_FLAG_KEYS.AI_CHAT] = false;
      expect(featureFlags.isAiChatEnabled()).toBe(false);
    });
  });

  describe('refresh', () => {
    it('refreshes remote config values', async () => {
      await featureFlags.initialize();
      mockRemoteConfig.fetchAndActivate.mockClear();

      await featureFlags.refresh();

      expect(mockRemoteConfig.fetchAndActivate).toHaveBeenCalled();
    });
  });
});

