import { useCallback, useEffect, useState } from 'react';
import type { DependencyList } from 'react';

export interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  isLoading: boolean;
  /** Повторити запит (кнопка «Спробувати ще раз») */
  reload: () => void;
}

/**
 * Завантажує дані й дає три стани списку: завантаження, помилка, дані (USB-04).
 * Запит повторюється, коли змінюються deps; відповідь застарілого запиту ігнорується.
 */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(undefined);

    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // load — нова функція на кожному рендері, тому залежимо лише від deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { data, error, isLoading, reload };
}
