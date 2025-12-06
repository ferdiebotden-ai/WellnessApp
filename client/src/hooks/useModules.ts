import { useCallback, useEffect, useState } from 'react';
import { fetchCoreModules, fetchCurrentUser, updatePrimaryModule } from '../services/api';
import type { ModuleSummary } from '../types/module';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface UseModulesResult {
  modules: ModuleSummary[];
  primaryModuleId: string | null;
  status: Status;
  error: string | null;
  isUpdating: boolean;
  selectPrimaryModule: (moduleId: string) => Promise<boolean>;
  reload: () => Promise<void>;
}

export const useModules = (): UseModulesResult => {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [primaryModuleId, setPrimaryModuleId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadModules = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      // Fetch modules and current user in parallel
      const [modulesData, userData] = await Promise.all([
        fetchCoreModules(),
        fetchCurrentUser(),
      ]);

      setModules(modulesData);
      setPrimaryModuleId(userData.user.preferences?.primary_module_id ?? null);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load modules');
    }
  }, []);

  useEffect(() => {
    void loadModules();
  }, [loadModules]);

  const selectPrimaryModule = useCallback(async (moduleId: string): Promise<boolean> => {
    // Optimistic update
    const previousModuleId = primaryModuleId;
    setPrimaryModuleId(moduleId);
    setIsUpdating(true);
    setError(null);

    try {
      await updatePrimaryModule(moduleId);
      setIsUpdating(false);
      return true;
    } catch (err) {
      // Revert on failure
      setPrimaryModuleId(previousModuleId);
      setIsUpdating(false);
      setError(err instanceof Error ? err.message : 'Failed to update primary module');
      return false;
    }
  }, [primaryModuleId]);

  return {
    modules,
    primaryModuleId,
    status,
    error,
    isUpdating,
    selectPrimaryModule,
    reload: loadModules,
  };
};
