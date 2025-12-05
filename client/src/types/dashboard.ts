export type TaskSource = 'schedule' | 'nudge';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'snoozed';

/**
 * Evidence strength level from protocol library
 */
export type EvidenceLevel = 'Very High' | 'High' | 'Moderate' | 'Emerging';

/**
 * Confidence level for UI display
 */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

/**
 * Structured reasoning content for a nudge
 * Displayed in the "Why?" expansion panel (Session 12)
 */
export interface WhyExpansion {
  /** 1-2 sentences explaining how the protocol works physiologically */
  mechanism: string;

  /** Citation with DOI link and evidence strength */
  evidence: {
    /** Full citation text from protocol */
    citation: string;
    /** Parsed DOI link (if available) */
    doi?: string;
    /** Evidence strength level */
    strength: EvidenceLevel;
  };

  /** Personalized insight based on user's data (max 150 chars) */
  your_data: string;

  /** Confidence assessment */
  confidence: {
    /** Mapped level for UI display */
    level: ConfidenceLevel;
    /** Human-readable explanation */
    explanation: string;
  };
}

export interface DashboardTask {
  id: string;
  documentId?: string;
  collectionPath?: string;
  title: string;
  source: TaskSource;
  status: TaskStatus;
  scheduledAt?: Date;
  emphasis?: string;
  /** Reasoning transparency data for nudges (Session 12) */
  whyExpansion?: WhyExpansion;
  /** Flag for TaskList to show AI thinking animation */
  isGenerating?: boolean;
}

export interface ModuleEnrollment {
  id: string;
  title: string;
  progressPct: number;
  currentStreak: number;
  focusArea: string;
  tier?: 'core' | 'pro';
}

export interface HealthMetric {
  id: string;
  label: string;
  valueLabel: string;
  trend: 'up' | 'down' | 'steady';
  progress: number;
}
