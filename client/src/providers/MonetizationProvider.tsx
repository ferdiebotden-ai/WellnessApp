import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMonetizationStatus } from '../services/api';
import type { MonetizationStatus, PaywallTrigger, SubscriptionTier } from '../types/monetization';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  openPaywall: (trigger: PaywallTrigger, options?: { dismissible?: boolean }) => void;
  closePaywall: () => void;
  requestChatAccess: () => boolean;
  requestProModuleAccess: () => boolean;
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

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      setLoading(true);
      try {
        const monetizationStatus = await fetchMonetizationStatus();
        if (isMounted) {
          setStatus(monetizationStatus);
        }
      } catch (error) {
        console.error('Failed to retrieve monetization status', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (isTrialExpired) {
      setPaywallTrigger('trial_expired');
      setPaywallDismissible(false);
      setPaywallVisible(true);
    }
  }, [isTrialExpired]);

  const openPaywall = (trigger: PaywallTrigger, options?: { dismissible?: boolean }) => {
    setPaywallTrigger(trigger);
    setPaywallDismissible(options?.dismissible ?? true);
    setPaywallVisible(true);
  };

  const closePaywall = () => {
    if (!isPaywallDismissible) {
      return;
    }

    setPaywallVisible(false);
    setPaywallTrigger(null);
  };

  const requestChatAccess = () => {
    if (activeSubscription) {
      return true;
    }

    if (isTrialExpired) {
      openPaywall('trial_expired', { dismissible: false });
      return false;
    }

    const limit = status?.chat_weekly_limit ?? 10;
    const used = status?.chat_queries_used_this_week ?? 0;

    if (used >= limit) {
      openPaywall('chat_limit');
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

    return true;
  };

  const requestProModuleAccess = () => {
    if (hasActiveSubscription(tier)) {
      return true;
    }

    openPaywall('pro_module');
    return false;
  };

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
