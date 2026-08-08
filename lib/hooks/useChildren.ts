import { useCallback, useEffect, useState } from 'react';

import { listChildren } from '../api/children';
import type { ChildRow } from '../database.types';

export function useChildren() {
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setChildren(await listChildren());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load children');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { children, loading, error, refresh };
}
