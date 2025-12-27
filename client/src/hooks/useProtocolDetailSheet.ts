/**
 * useProtocolDetailSheet Hook
 *
 * Wrapper around useProtocolDetail with pre-parsed data for QuickSheet display.
 * Parses description into instructions and formats data for UI consumption.
 *
 * @file client/src/hooks/useProtocolDetailSheet.ts
 * @session 97 (MVP-006)
 */

import { useMemo } from 'react';
import { useProtocolDetail } from './useProtocolDetail';
import type {
  ProtocolDetail,
  UserProtocolData,
  ConfidenceResult,
  StudySource,
} from '../types/protocol';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface UseProtocolDetailSheetResult {
  /** Full protocol data */
  protocol: ProtocolDetail | null;

  /** User-specific data (adherence, completions) */
  userData: UserProtocolData;

  /** Confidence scoring (not used in MVP but available) */
  confidence: ConfidenceResult;

  /** Loading status */
  status: Status;

  /** Error message if failed */
  error: string | null;

  // Pre-parsed for sheet display

  /** Instructions parsed from description into bullet points */
  instructions: string[];

  /** Mechanism explanation text */
  mechanismText: string;

  /** Study sources for Research & Evidence section */
  studySources: StudySource[];

  /** Formatted "last completed" text */
  lastCompletedFormatted: string;
}

/**
 * Parse description text into bullet point instructions.
 * Splits on periods, filters empty strings.
 */
function parseInstructions(description: string | null | undefined): string[] {
  if (!description) return [];

  return description
    .split(/[.•\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 200); // Filter out empty and overly long items
}

/**
 * Format last completed timestamp into readable text.
 */
function formatLastCompleted(lastCompletedAt: string | null): string {
  if (!lastCompletedAt) return 'Not yet completed';

  const date = new Date(lastCompletedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export const useProtocolDetailSheet = (
  protocolId: string | null | undefined
): UseProtocolDetailSheetResult => {
  const { protocol, userData, confidence, status, error } = useProtocolDetail(protocolId);

  // Parse instructions from description
  const instructions = useMemo(() => {
    const desc = protocol?.description;
    // Handle description being string or string[]
    const descriptionText = Array.isArray(desc) ? desc.join('. ') : desc;
    return parseInstructions(descriptionText);
  }, [protocol?.description]);

  // Get mechanism text
  const mechanismText = useMemo(() => {
    const desc = protocol?.description;
    const descriptionText = Array.isArray(desc) ? desc.join('. ') : (desc || '');
    return protocol?.mechanism_description || descriptionText;
  }, [protocol?.mechanism_description, protocol?.description]);

  // Get study sources
  const studySources = useMemo(() => {
    return protocol?.study_sources || [];
  }, [protocol?.study_sources]);

  // Format last completed
  const lastCompletedFormatted = useMemo(() => {
    return formatLastCompleted(userData.last_completed_at);
  }, [userData.last_completed_at]);

  return {
    protocol,
    userData,
    confidence,
    status,
    error,
    instructions,
    mechanismText,
    studySources,
    lastCompletedFormatted,
  };
};
