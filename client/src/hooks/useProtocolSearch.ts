import { useCallback, useState } from 'react';
import { searchProtocols, ProtocolSearchResult } from '../services/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

export const useProtocolSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProtocolSearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const executeSearch = useCallback(async (rawQuery: string) => {
    const trimmedQuery = rawQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      setStatus('idle');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const data = await searchProtocols(trimmedQuery);
      setResults(data);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to search protocols');
    }
  }, []);

  return { query, setQuery, results, status, error, search: executeSearch };
};
