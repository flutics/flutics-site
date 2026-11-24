import { useEffect, useState } from 'react';
import { subscribeDb } from './db/client';

export function useLive<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeDb(() => setTick((t) => t + 1)), []);

  useEffect(() => {
    let ok = true;
    setLoading(true);
    fn()
      .then((v) => {
        if (ok) {
          setData(v);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (ok) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (ok) setLoading(false);
      });
    return () => {
      ok = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, error, loading };
}
