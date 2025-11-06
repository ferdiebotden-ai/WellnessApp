export type TaskSource = 'schedule' | 'nudge';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface DashboardTask {
  id: string;
  documentId?: string;
  collectionPath?: string;
  title: string;
  source: TaskSource;
  status: TaskStatus;
  scheduledAt?: Date;
  emphasis?: string;
}

export interface ModuleEnrollment {
  id: string;
  title: string;
  progressPct: number;
  currentStreak: number;
  focusArea: string;
}

export interface HealthMetric {
  id: string;
  label: string;
  valueLabel: string;
  trend: 'up' | 'down' | 'steady';
  progress: number;
}
