import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { getChild } from './api/children';
import type { ChildRow } from './database.types';

interface ChildContextValue {
  child: ChildRow | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const ChildContext = createContext<ChildContextValue | undefined>(undefined);

export function ChildProvider({ childId, children }: PropsWithChildren<{ childId: string }>) {
  const [child, setChild] = useState<ChildRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getChild(childId)
      .then((row) => {
        if (!cancelled) setChild(row);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load child');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [childId, refreshToken]);

  return (
    <ChildContext.Provider
      value={{ child, loading, error, refresh: () => setRefreshToken((t) => t + 1) }}
    >
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error('useChild must be used within a ChildProvider');
  return ctx;
}
