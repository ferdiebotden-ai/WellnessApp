import { Mixpanel } from 'mixpanel-react-native';
import type { PaywallTrigger } from '../types/monetization';

export type AiChatIntent =
  | 'quick_access'
  | 'habit_check_in'
  | 'protocol_follow_up'
  | 'library_search'
  | 'unknown';

export type ProtocolLogSource = 'schedule' | 'manual' | 'nudge' | 'unknown';

interface PaywallViewedEvent {
  trigger: PaywallTrigger;
  triggerModuleId: string | null;
}

interface ProtocolLoggedEvent {
  protocolId: string;
  moduleId: string;
  source: ProtocolLogSource;
}

interface AiChatQueryEvent {
  intentDetected: AiChatIntent;
}

interface AiChatLimitContext {
  weeklyLimit?: number | null;
  queriesUsed?: number | null;
}

interface IdentifyUserPayload {
  email?: string | null;
}

class AnalyticsService {
  private mixpanel: Mixpanel | null = null;

  private initializationPromise: Promise<Mixpanel | null> | null = null;

  /**
   * Initializes the Mixpanel SDK if a valid token is configured.
   */
  async init(): Promise<void> {
    await this.ensureInitialized();
  }

  /**
   * Identifies the current user in Mixpanel so subsequent events are tied to
   * the correct distinct ID.
   */
  async identifyUser(userId: string, payload?: IdentifyUserPayload): Promise<void> {
    if (!userId) {
      return;
    }

    const client = await this.ensureInitialized();
    if (!client) {
      return;
    }

    try {
      await client.identify(userId);
      const sanitizedProperties = this.sanitizeProperties({
        email: payload?.email ?? undefined,
      });

      if (sanitizedProperties) {
        await client.registerSuperProperties(sanitizedProperties);
      }
    } catch (error) {
      console.warn('Failed to identify Mixpanel user', error);
    }
  }

  /**
   * Records the initial account creation event once a user signs up.
   */
  async trackUserSignup(params: { moduleId?: string | null }): Promise<void> {
    await this.track('user_signup', {
      module_id: params.moduleId ?? null,
    });
  }

  /**
   * Tracks completion of the onboarding flow along with the selected module.
   */
  async trackOnboardingComplete(params: { primaryModuleId: string }): Promise<void> {
    await this.track('onboarding_complete', {
      primary_module_id: params.primaryModuleId,
    });
  }

  /**
   * Captures protocol completion logs queued on the device.
   */
  async trackProtocolLogged(event: ProtocolLoggedEvent): Promise<void> {
    await this.track('protocol_logged', {
      protocol_id: event.protocolId,
      module_id: event.moduleId,
      source: event.source,
    });
  }

  /**
   * Tracks when the paywall modal is presented to the user.
   */
  async trackPaywallViewed(event: PaywallViewedEvent): Promise<void> {
    await this.track('paywall_viewed', {
      trigger: event.trigger,
      trigger_module_id: event.triggerModuleId,
    });
  }

  /**
   * Records when a user initiates the subscription purchase flow.
   */
  async trackSubscriptionStarted(): Promise<void> {
    await this.track('subscription_started');
  }

  /**
   * Tracks when the Core subscription purchase is confirmed by the store.
   */
  async trackSubscriptionActivated(context: { productIdentifier?: string | null }): Promise<void> {
    await this.track('subscription_activated', {
      product_identifier: context.productIdentifier ?? null,
    });
  }

  /**
   * Tracks individual AI chat queries sent from the device.
   */
  async trackAiChatQuerySent(event: AiChatQueryEvent): Promise<void> {
    await this.track('ai_chat_query_sent', {
      intent_detected: event.intentDetected,
    });
  }

  /**
   * Captures when a user exhausts their chat quota for the week.
   */
  async trackAiChatLimitHit(context?: AiChatLimitContext): Promise<void> {
    await this.track('ai_chat_limit_hit', {
      weekly_limit: context?.weeklyLimit ?? null,
      queries_used: context?.queriesUsed ?? null,
    });
  }

  private async track(eventName: string, properties?: Record<string, unknown> | null): Promise<void> {
    const client = await this.ensureInitialized();
    if (!client) {
      return;
    }

    try {
      const sanitized = this.sanitizeProperties(properties ?? undefined);
      await client.track(eventName, sanitized ?? undefined);
    } catch (error) {
      console.warn(`Failed to track Mixpanel event "${eventName}"`, error);
    }
  }

  private sanitizeProperties(properties?: Record<string, unknown>): Record<string, unknown> | null {
    if (!properties) {
      return null;
    }

    const entries = Object.entries(properties).filter(([, value]) => value !== undefined);
    if (entries.length === 0) {
      return null;
    }

    return Object.fromEntries(entries);
  }

  private async ensureInitialized(): Promise<Mixpanel | null> {
    if (this.mixpanel) {
      return this.mixpanel;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
    if (!token) {
      console.log('Mixpanel not configured. Analytics disabled in development.');
      return null;
    }

    // Mixpanel v3 uses async init with trackAutomaticEvents parameter
    const trackAutomaticEvents = false;
    const instance = new Mixpanel(token, trackAutomaticEvents);
    const initialization = instance
      .init()
      .then(() => {
        this.mixpanel = instance;
        return instance;
      })
      .catch((error) => {
        console.warn('Failed to initialize Mixpanel analytics', error);
        this.mixpanel = null;
        return null;
      })
      .finally(() => {
        this.initializationPromise = null;
      });

    this.initializationPromise = initialization;
    return initialization;
  }
}

export const analytics = new AnalyticsService();

export default analytics;
