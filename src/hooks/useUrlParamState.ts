import { useCallback, useEffect, useRef, useState } from 'react';

type Options<T extends string> = {
  /** Rejects values that are not valid for this page (stale or hand-typed links). */
  isValid?: (value: string) => value is T;
  /** Drop the param from the URL when the value equals the default. */
  omitWhenDefault?: boolean;
};

const readParam = (param: string): string | null => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(param);
};

/**
 * Page state that lives in the URL, so every view is reachable by link.
 *
 * The URL wins on first render and on back/forward; later changes are written
 * with `replaceState`, so switching a tab does not stack history entries.
 */
export function useUrlParamState<T extends string>(
  param: string,
  fallback: T | (() => T),
  options: Options<T> = {}
): [T, (value: T) => void] {
  const { isValid, omitWhenDefault = true } = options;
  const defaultValue = useRef<T>(typeof fallback === 'function' ? (fallback as () => T)() : fallback);

  const resolve = useCallback(
    (raw: string | null): T | null => {
      if (!raw) return null;
      if (isValid && !isValid(raw)) return null;
      return raw as T;
    },
    [isValid]
  );

  const [value, setValue] = useState<T>(() => resolve(readParam(param)) ?? defaultValue.current);

  const write = useCallback(
    (next: T) => {
      setValue(next);
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (omitWhenDefault && next === defaultValue.current) url.searchParams.delete(param);
      else url.searchParams.set(param, next);
      window.history.replaceState(window.history.state, '', url.toString());
    },
    [param, omitWhenDefault]
  );

  // Keep the URL and the state in step when the user navigates history.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPopState = () => {
      const fromUrl = resolve(readParam(param));
      setValue(fromUrl ?? defaultValue.current);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [param, resolve]);

  return [value, write];
}

export default useUrlParamState;
