export type SubscriptionTier = 'free' | 'trial' | 'core' | 'pro';

export interface MonetizationStatus {
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  subscription_tier?: SubscriptionTier | null;
  chat_queries_used_this_week?: number | null;
  chat_weekly_limit?: number | null;
}

export type PaywallTrigger = 'trial_expired' | 'chat_limit' | 'pro_module' | 'soft_prompt';
