/**
 * useProtocolDetail Hook
 *
 * Fetches enriched protocol data with user-specific personalization:
 * - Protocol details (mechanism, parameters, study sources)
 * - User's relationship (adherence, last completed, difficulty)
 * - Calculated confidence from 5-factor scoring
 *
 * Session 59: Protocol Data Enrichment & Personalization
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchPersonalizedProtocol } from '../services/api';
import type {
  ProtocolDetail,
  UserProtocolData,
  ConfidenceResult,
  PersonalizedProtocolResponse,
} from '../types/protocol';
import {
  DEFAULT_USER_PROTOCOL_DATA,
  DEFAULT_CONFIDENCE_RESULT,
} from '../types/protocol';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface UseProtocolDetailResult {
  /** Enriched protocol data */
  protocol: ProtocolDetail | null;

  /** User-specific data for this protocol */
  userData: UserProtocolData;

  /** Calculated confidence from 5-factor system */
  confidence: ConfidenceResult;

  /** Loading status */
  status: Status;

  /** Error message if failed */
  error: string | null;

  /** Reload the protocol data */
  reload: () => Promise<void>;
}

export const useProtocolDetail = (
  protocolId: string | null | undefined
): UseProtocolDetailResult => {
  const [protocol, setProtocol] = useState<ProtocolDetail | null>(null);
  const [userData, setUserData] = useState<UserProtocolData>(DEFAULT_USER_PROTOCOL_DATA);
  const [confidence, setConfidence] = useState<ConfidenceResult>(DEFAULT_CONFIDENCE_RESULT);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadProtocol = useCallback(async () => {
    if (!protocolId) {
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response: PersonalizedProtocolResponse = await fetchPersonalizedProtocol(protocolId);

      setProtocol(response.protocol);
      setUserData(response.user_data);
      setConfidence(response.confidence);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load protocol');
      // Reset to defaults on error
      setProtocol(null);
      setUserData(DEFAULT_USER_PROTOCOL_DATA);
      setConfidence(DEFAULT_CONFIDENCE_RESULT);
    }
  }, [protocolId]);

  useEffect(() => {
    if (!protocolId) {
      setProtocol(null);
      setUserData(DEFAULT_USER_PROTOCOL_DATA);
      setConfidence(DEFAULT_CONFIDENCE_RESULT);
      setStatus('idle');
      setError(null);
      return;
    }

    void loadProtocol();
  }, [protocolId, loadProtocol]);

  return {
    protocol,
    userData,
    confidence,
    status,
    error,
    reload: loadProtocol,
  };
};
