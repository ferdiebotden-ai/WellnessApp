import { useCallback, useEffect, useState } from 'react';
import { fetchCoreModules } from '../services/api';
import type { ModuleSummary } from '../types/module';

type Status = 'idle' | 'loading' | 'success' | 'error';

export const useCoreModules = () => {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await fetchCoreModules();
      setModules(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load modules');
    }
  }, []);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  return { modules, status, error, reload: loadModules };
};
