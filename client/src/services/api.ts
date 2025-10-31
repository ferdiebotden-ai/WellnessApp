import { getAuth } from 'firebase/auth';
import type { ModuleSummary } from '../types/module';

type HttpMethod = 'GET' | 'POST';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';

const request = async <T>(path: string, method: HttpMethod, body?: unknown): Promise<T> => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User is not authenticated');
  }

  const token = await currentUser.getIdToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = (errorPayload as { error?: string }).error || 'Unexpected error';
    throw new Error(message);
  }

  return response.json() as Promise<T>;
};

export const fetchCoreModules = () =>
  request<ModuleSummary[]>(`/api/modules?tier=core`, 'GET');

export const completeOnboarding = (primaryModuleId: string) =>
  request<{ success: boolean; trial_start_date: string; trial_end_date: string; primary_module_id: string }>(
    '/api/onboarding/complete',
    'POST',
    { primary_module_id: primaryModuleId }
  );
