import { useCallback, useEffect, useState } from 'react';

import { listMemories } from '../api/memories';
import type { MemoryRow } from '../database.types';

export function useMemories(childId: string) {
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setMemories(await listMemories(childId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load memories');
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { memories, loading, error, refresh };
}
