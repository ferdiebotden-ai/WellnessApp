import { getRemoteConfig, getValue, RemoteConfig } from 'firebase/remote-config';
import { getFirebaseApp } from './firebase';

/**
 * Feature flag keys for all MVP modules and critical features.
 */
export const FEATURE_FLAG_KEYS = {
  MODULE_SLEEP: 'enable_module_sleep',
  MODULE_MORNING: 'enable_module_morning',
  MODULE_FOCUS: 'enable_module_focus',
  MODULE_STRESS: 'enable_module_stress',
  MODULE_ENERGY: 'enable_module_energy',
  MODULE_DOPAMINE: 'enable_module_dopamine',
  AI_CHAT: 'enable_ai_chat',
} as const;

/**
 * Default values for feature flags.
 * All flags default to true to enable full MVP functionality.
 */
const DEFAULT_FLAGS: Record<string, boolean> = {
  [FEATURE_FLAG_KEYS.MODULE_SLEEP]: true,
  [FEATURE_FLAG_KEYS.MODULE_MORNING]: true,
  [FEATURE_FLAG_KEYS.MODULE_FOCUS]: true,
  [FEATURE_FLAG_KEYS.MODULE_STRESS]: true,
  [FEATURE_FLAG_KEYS.MODULE_ENERGY]: true,
  [FEATURE_FLAG_KEYS.MODULE_DOPAMINE]: true,
  [FEATURE_FLAG_KEYS.AI_CHAT]: true, // Critical killswitch - defaults to true
};

/**
 * Feature flag service for managing Firebase Remote Config integration.
 * Provides type-safe access to feature flags with caching and error handling.
 */
class FeatureFlagService {
  private remoteConfig: RemoteConfig | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initializes Firebase Remote Config with default values.
   * Sets cache expiration to 12 hours (43200 seconds).
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      const app = getFirebaseApp();
      this.remoteConfig = getRemoteConfig(app);

      // Set default values
      this.remoteConfig.defaultConfig = DEFAULT_FLAGS;

      // Set cache expiration to 12 hours (43200 seconds)
      this.remoteConfig.settings.minimumFetchIntervalMillis = 12 * 60 * 60 * 1000;

      // Fetch and activate remote config values
      await this.remoteConfig.ensureInitialized();
      await this.remoteConfig.fetchAndActivate();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize feature flags', error);
      // Continue with defaults if initialization fails
      this.initialized = true;
    }
  }

  /**
   * Manually refresh feature flags from Firebase Remote Config.
   * Useful for testing or when immediate updates are needed.
   */
  async refresh(): Promise<void> {
    if (!this.remoteConfig) {
      await this.initialize();
      return;
    }

    try {
      await this.remoteConfig.fetchAndActivate();
    } catch (error) {
      console.error('Failed to refresh feature flags', error);
    }
  }

  /**
   * Gets a boolean feature flag value.
   * @param key Feature flag key
   * @param defaultValue Default value if flag is not found (defaults to false)
   * @returns Feature flag boolean value
   */
  getBoolean(key: string, defaultValue = false): boolean {
    if (!this.initialized) {
      console.warn(`Feature flags not initialized, using default value for ${key}`);
      return DEFAULT_FLAGS[key] ?? defaultValue;
    }

    if (!this.remoteConfig) {
      return DEFAULT_FLAGS[key] ?? defaultValue;
    }

    try {
      const value = getValue(this.remoteConfig, key);
      return value.asBoolean();
    } catch (error) {
      console.error(`Failed to get feature flag ${key}`, error);
      return DEFAULT_FLAGS[key] ?? defaultValue;
    }
  }

  /**
   * Checks if a module is enabled.
   * @param moduleId Module identifier (e.g., 'sleep', 'focus')
   * @returns True if module is enabled
   */
  isModuleEnabled(moduleId: string): boolean {
    const flagKey = this.getModuleFlagKey(moduleId);
    if (!flagKey) {
      // If module doesn't have a flag, default to enabled
      return true;
    }
    return this.getBoolean(flagKey, true);
  }

  /**
   * Checks if AI chat is enabled.
   * @returns True if AI chat is enabled
   */
  isAiChatEnabled(): boolean {
    return this.getBoolean(FEATURE_FLAG_KEYS.AI_CHAT, true);
  }

  /**
   * Maps module ID to feature flag key.
   * @param moduleId Module identifier
   * @returns Feature flag key or null if not mapped
   */
  private getModuleFlagKey(moduleId: string): string | null {
    const moduleIdLower = moduleId.toLowerCase();
    
    if (moduleIdLower.includes('sleep')) {
      return FEATURE_FLAG_KEYS.MODULE_SLEEP;
    }
    if (moduleIdLower.includes('morning')) {
      return FEATURE_FLAG_KEYS.MODULE_MORNING;
    }
    if (moduleIdLower.includes('focus')) {
      return FEATURE_FLAG_KEYS.MODULE_FOCUS;
    }
    if (moduleIdLower.includes('stress') || moduleIdLower.includes('resilience')) {
      return FEATURE_FLAG_KEYS.MODULE_STRESS;
    }
    if (moduleIdLower.includes('energy') || moduleIdLower.includes('recovery')) {
      return FEATURE_FLAG_KEYS.MODULE_ENERGY;
    }
    if (moduleIdLower.includes('dopamine')) {
      return FEATURE_FLAG_KEYS.MODULE_DOPAMINE;
    }

    return null;
  }
}

export const featureFlags = new FeatureFlagService();

