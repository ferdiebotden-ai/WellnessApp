import { useCallback, useEffect, useState } from 'react';
import { fetchProtocolById } from '../services/api';
import type { ProtocolDetail } from '../types/protocol';

type Status = 'idle' | 'loading' | 'success' | 'error';

export const useProtocolDetail = (protocolId: string | null | undefined) => {
  const [protocol, setProtocol] = useState<ProtocolDetail | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadProtocol = useCallback(async () => {
    if (!protocolId) {
      setProtocol(null);
      setStatus('idle');
      setError(null);
      return;
    }

    setProtocol(null);
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchProtocolById(protocolId);
      setProtocol(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load protocol');
    }
  }, [protocolId]);

  useEffect(() => {
    if (!protocolId) {
      setProtocol(null);
      setStatus('idle');
      setError(null);
      return;
    }

    void loadProtocol();
  }, [protocolId, loadProtocol]);

  const currentProtocol = status === 'success' ? protocol : null;

  return { protocol: currentProtocol, status, error, reload: loadProtocol };
};
