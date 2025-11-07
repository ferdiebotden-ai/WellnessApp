export interface ModuleSummary {
  id: string;
  name: string;
  tier: 'core' | 'premium' | 'pro' | 'elite';
  headline?: string;
  description?: string;
}
