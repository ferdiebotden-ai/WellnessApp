export interface ModuleSummary {
  id: string;
  name: string;
  tier: 'core' | 'premium' | 'pro';
  headline?: string;
  description?: string;
}
