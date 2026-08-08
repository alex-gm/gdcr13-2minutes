import { useEffect, useState } from 'react';

import { getMemory, getSignedAudioUrl, getSignedPhotoUrl, subscribeToMemory } from '../api/memories';
import type { MemoryRow } from '../database.types';

export function useMemory(memoryId: string) {
  const [memory, setMemory] = useState<MemoryRow | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const row = await getMemory(memoryId);
        if (cancelled) return;
        setMemory(row);
        if (row.audio_path) setAudioUrl(await getSignedAudioUrl(row.audio_path));
        if (row.photo_path) setPhotoUrl(await getSignedPhotoUrl(row.photo_path));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load memory');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    const unsubscribe = subscribeToMemory(memoryId, (row) => {
      if (!cancelled) setMemory(row);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [memoryId]);

  return { memory, audioUrl, photoUrl, loading, error };
}
