import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Process-wide cache for parsed datasets.
 *
 * Every data hook used to keep its own useState copy and re-run the full
 * row -> object mapping on each mount, so a page that renders three components
 * off the same sheet parsed the same tens of thousands of rows three times and
 * held three copies of the result. This store keeps one parsed array per
 * (dataset, mode) key, hands every subscriber the same reference, and only
 * re-parses once the entry goes stale.
 */

const DEFAULT_TTL = 5 * 60 * 1000;

interface Entry<T> {
  data?: T;
  error?: string;
  timestamp: number;
  promise?: Promise<void>;
  subscribers: Set<() => void>;
}

const store = new Map<string, Entry<unknown>>();

const getEntry = <T,>(key: string): Entry<T> => {
  let entry = store.get(key) as Entry<T> | undefined;
  if (!entry) {
    entry = { timestamp: 0, subscribers: new Set() };
    store.set(key, entry as Entry<unknown>);
  }
  return entry;
};

const notify = (entry: Entry<unknown>) => {
  entry.subscribers.forEach((listener) => {
    try {
      listener();
    } catch {
      /* a broken listener must not stop the others */
    }
  });
};

const isFresh = (entry: Entry<unknown>, ttl: number) =>
  entry.data !== undefined && Date.now() - entry.timestamp < ttl;

const load = <T,>(key: string, loader: () => Promise<T>, ttl: number, force: boolean): Promise<void> => {
  const entry = getEntry<T>(key);

  if (!force && isFresh(entry, ttl)) return Promise.resolve();
  if (entry.promise) return entry.promise;

  entry.promise = loader()
    .then((data) => {
      entry.data = data;
      entry.error = undefined;
      entry.timestamp = Date.now();
    })
    .catch((error: unknown) => {
      entry.error = error instanceof Error ? error.message : 'Failed to load data';
      entry.timestamp = Date.now();
    })
    .finally(() => {
      entry.promise = undefined;
      notify(entry as Entry<unknown>);
    });

  return entry.promise;
};

/** Drop cached datasets so the next subscriber refetches (e.g. after a source switch). */
export const invalidateDataset = (keyPrefix?: string) => {
  store.forEach((entry, key) => {
    if (keyPrefix && !key.startsWith(keyPrefix)) return;
    entry.data = undefined;
    entry.timestamp = 0;
    notify(entry);
  });
};

/** Warm a dataset without rendering anything that depends on it. */
export const prefetchDataset = <T,>(key: string, loader: () => Promise<T>, ttl = DEFAULT_TTL) =>
  load(key, loader, ttl, false);

export interface SharedDatasetResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSharedDataset<T>(
  key: string,
  loader: () => Promise<T>,
  ttl = DEFAULT_TTL,
): SharedDatasetResult<T> {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [, forceRender] = useState(0);
  const entry = getEntry<T>(key);

  useEffect(() => {
    const current = getEntry<T>(key);
    const listener = () => forceRender((value) => value + 1);
    current.subscribers.add(listener);

    void load(key, () => loaderRef.current(), ttl, false);

    return () => {
      current.subscribers.delete(listener);
    };
  }, [key, ttl]);

  const refetch = useCallback(() => load(key, () => loaderRef.current(), ttl, true), [key, ttl]);

  return {
    data: entry.data,
    loading: entry.data === undefined && entry.error === undefined,
    error: entry.error ?? null,
    refetch,
  };
}
