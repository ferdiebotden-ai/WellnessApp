// Mock Mixpanel service for Web

export type AiChatIntent =
  | 'quick_access'
  | 'habit_check_in'
  | 'protocol_follow_up'
  | 'library_search'
  | 'unknown';

export type ProtocolLogSource = 'schedule' | 'manual' | 'nudge' | 'unknown';

interface PaywallViewedEvent {
  trigger: any;
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
  /**
   * Initializes the Mixpanel SDK if a valid token is configured.
   */
  async init(): Promise<void> {
    console.log('WEB MOCK: Analytics init');
  }

  /**
   * Identifies the current user in Mixpanel so subsequent events are tied to
   * the correct distinct ID.
   */
  async identifyUser(userId: string, payload?: IdentifyUserPayload): Promise<void> {
    console.log('WEB MOCK: Analytics identifyUser', { userId, payload });
  }

  /**
   * Records the initial account creation event once a user signs up.
   */
  async trackUserSignup(params: { moduleId?: string | null }): Promise<void> {
    console.log('WEB MOCK: Analytics trackUserSignup', params);
  }

  /**
   * Tracks completion of the onboarding flow along with the selected module.
   */
  async trackOnboardingComplete(params: { primaryModuleId: string }): Promise<void> {
    console.log('WEB MOCK: Analytics trackOnboardingComplete', params);
  }

  /**
   * Captures protocol completion logs queued on the device.
   */
  async trackProtocolLogged(event: ProtocolLoggedEvent): Promise<void> {
    console.log('WEB MOCK: Analytics trackProtocolLogged', event);
  }

  /**
   * Tracks when the paywall modal is presented to the user.
   */
  async trackPaywallViewed(event: PaywallViewedEvent): Promise<void> {
    console.log('WEB MOCK: Analytics trackPaywallViewed', event);
  }

  /**
   * Records when a user initiates the subscription purchase flow.
   */
  async trackSubscriptionStarted(): Promise<void> {
    console.log('WEB MOCK: Analytics trackSubscriptionStarted');
  }

  /**
   * Tracks when the Core subscription purchase is confirmed by the store.
   */
  async trackSubscriptionActivated(context: { productIdentifier?: string | null }): Promise<void> {
    console.log('WEB MOCK: Analytics trackSubscriptionActivated', context);
  }

  /**
   * Tracks individual AI chat queries sent from the device.
   */
  async trackAiChatQuerySent(event: AiChatQueryEvent): Promise<void> {
    console.log('WEB MOCK: Analytics trackAiChatQuerySent', event);
  }

  /**
   * Captures when a user exhausts their chat quota for the week.
   */
  async trackAiChatLimitHit(context?: AiChatLimitContext): Promise<void> {
    console.log('WEB MOCK: Analytics trackAiChatLimitHit', context);
  }
}

export const analytics = new AnalyticsService();

export default analytics;

