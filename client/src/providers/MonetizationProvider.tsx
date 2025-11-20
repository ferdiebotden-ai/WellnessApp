import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { fetchMonetizationStatus } from '../services/api';
import analytics, { AiChatIntent } from '../services/AnalyticsService';
import type { MonetizationStatus, PaywallTrigger, SubscriptionTier } from '../types/monetization';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEV_MODE_FULL_ACCESS = true; // Set to false in production

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

interface MonetizationContextValue {
  loading: boolean;
  status: MonetizationStatus | null;
  daysLeftInTrial: number | null;
  hasTrial: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  chatLimitRemaining: number | null;
  shouldShowSoftReminder: boolean;
  markSoftReminderSeen: () => void;
  isPaywallVisible: boolean;
  isPaywallDismissible: boolean;
  paywallTrigger: PaywallTrigger | null;
  openPaywall: (
    trigger: PaywallTrigger,
    options?: { dismissible?: boolean; triggerModuleId?: string | null }
  ) => void;
  closePaywall: () => void;
  requestChatAccess: (options?: { intent?: AiChatIntent }) => boolean;
  requestProModuleAccess: (moduleId?: string | null) => boolean;
  refreshStatus: () => Promise<void>;
}

const MonetizationContext = createContext<MonetizationContextValue | undefined>(undefined);

const hasActiveSubscription = (tier?: SubscriptionTier | null) => tier === 'core' || tier === 'pro';

export const MonetizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<MonetizationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [softReminderSeen, setSoftReminderSeen] = useState(false);
  const [isPaywallVisible, setPaywallVisible] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger | null>(null);
  const [isPaywallDismissible, setPaywallDismissible] = useState(true);
  const isMountedRef = useRef(true);

  const loadStatus = useCallback(async () => {
    if (isMountedRef.current) {
      setLoading(true);
    }

    try {
      const monetizationStatus = await fetchMonetizationStatus();
      if (isMountedRef.current) {
        if (DEV_MODE_FULL_ACCESS) {
          setStatus({
            ...monetizationStatus,
            subscription_tier: 'pro',
            chat_weekly_limit: 9999,
            chat_queries_used_this_week: 0,
          });
        } else {
        setStatus(monetizationStatus);
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Failed to retrieve monetization status', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadStatus();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadStatus]);

  const now = useMemo(() => startOfDay(new Date()), [status?.trial_end_date]);
  const trialEnd = useMemo(
    () => (status?.trial_end_date ? startOfDay(new Date(status.trial_end_date)) : null),
    [status?.trial_end_date]
  );

  const tier = status?.subscription_tier ?? null;
  const activeSubscription = hasActiveSubscription(tier);
  const hasTrialDates = Boolean(trialEnd);
  const onTrialTier = tier === 'trial' || (!tier && hasTrialDates && !activeSubscription);
  const hasTrial = hasTrialDates && onTrialTier;

  const daysLeftInTrial = useMemo(() => {
    if (!trialEnd) {
      return null;
    }

    const diff = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.round(diff / MS_PER_DAY));
  }, [trialEnd, now]);

  const isTrialExpired = useMemo(() => {
    if (!hasTrial || !trialEnd) {
      return false;
    }

    return now.getTime() > trialEnd.getTime();
  }, [hasTrial, now, trialEnd]);

  const isTrialActive = useMemo(() => {
    if (!hasTrial || !trialEnd) {
      return false;
    }

    return now.getTime() <= trialEnd.getTime();
  }, [hasTrial, now, trialEnd]);

  const chatLimitRemaining = useMemo(() => {
    if (activeSubscription) {
      return null;
    }

    const limit = status?.chat_weekly_limit ?? 10;
    const used = status?.chat_queries_used_this_week ?? 0;
    return Math.max(0, limit - used);
  }, [activeSubscription, status?.chat_weekly_limit, status?.chat_queries_used_this_week]);

  const shouldShowSoftReminder = useMemo(() => {
    if (!hasTrial || !isTrialActive || softReminderSeen || daysLeftInTrial === null) {
      return false;
    }

    return daysLeftInTrial === 7;
  }, [daysLeftInTrial, hasTrial, isTrialActive, softReminderSeen]);

  useEffect(() => {
    if (DEV_MODE_FULL_ACCESS) {
      return; // Don't show paywall in dev mode
    }
    if (isTrialExpired) {
      setPaywallTrigger('trial_expired');
      setPaywallDismissible(false);
      setPaywallVisible(true);
      void analytics.trackPaywallViewed({ trigger: 'trial_expired', triggerModuleId: null });
    }
  }, [isTrialExpired]);

  const openPaywall = (
    trigger: PaywallTrigger,
    options?: { dismissible?: boolean; triggerModuleId?: string | null }
  ) => {
    if (DEV_MODE_FULL_ACCESS) {
      return;
    }
    setPaywallTrigger(trigger);
    setPaywallDismissible(options?.dismissible ?? true);
    setPaywallVisible(true);
    void analytics.trackPaywallViewed({
      trigger,
      triggerModuleId: options?.triggerModuleId ?? null,
    });
  };

  const closePaywall = () => {
    if (!isPaywallDismissible) {
      return;
    }

    setPaywallVisible(false);
    setPaywallTrigger(null);
  };

  const requestChatAccess = (options?: { intent?: AiChatIntent }) => {
    if (DEV_MODE_FULL_ACCESS) {
      void analytics.trackAiChatQuerySent({ intentDetected: options?.intent ?? 'unknown' });
      return true; // Allow all chat access in dev mode
    }

    if (activeSubscription) {
      void analytics.trackAiChatQuerySent({ intentDetected: options?.intent ?? 'unknown' });
      return true;
    }

    if (isTrialExpired) {
      openPaywall('trial_expired', { dismissible: false, triggerModuleId: null });
      return false;
    }

    const limit = status?.chat_weekly_limit ?? 10;
    const used = status?.chat_queries_used_this_week ?? 0;

    if (used >= limit) {
      void analytics.trackAiChatLimitHit({ weeklyLimit: limit, queriesUsed: used });
      openPaywall('chat_limit', { triggerModuleId: null });
      return false;
    }

    setStatus((previous) => {
      if (!previous) {
        return previous;
      }

      const currentUsed = previous.chat_queries_used_this_week ?? 0;
      return {
        ...previous,
        chat_queries_used_this_week: currentUsed + 1,
      };
    });

    void analytics.trackAiChatQuerySent({ intentDetected: options?.intent ?? 'unknown' });

    return true;
  };

  const requestProModuleAccess = (moduleId?: string | null) => {
    if (DEV_MODE_FULL_ACCESS) {
      return true; // Allow all module access in dev mode
    }

    if (hasActiveSubscription(tier)) {
      return true;
    }

    openPaywall('pro_module', { triggerModuleId: moduleId ?? null });
    return false;
  };

  const refreshStatus = useCallback(async () => {
    await loadStatus();
  }, [loadStatus]);

  const value: MonetizationContextValue = {
    loading,
    status,
    daysLeftInTrial,
    hasTrial,
    isTrialActive,
    isTrialExpired,
    chatLimitRemaining,
    shouldShowSoftReminder,
    markSoftReminderSeen: () => setSoftReminderSeen(true),
    isPaywallVisible,
    isPaywallDismissible,
    paywallTrigger,
    openPaywall,
    closePaywall,
    requestChatAccess,
    requestProModuleAccess,
    refreshStatus,
  };

  return <MonetizationContext.Provider value={value}>{children}</MonetizationContext.Provider>;
};

export const useMonetization = (): MonetizationContextValue => {
  const context = useContext(MonetizationContext);
  if (!context) {
    throw new Error('useMonetization must be used within a MonetizationProvider');
  }

  return context;
};
