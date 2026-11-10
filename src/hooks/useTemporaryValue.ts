import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Значення, яке саме зникає через duration мс.
 * Наприклад, підказка «Додано в кошик ✓» на кнопці.
 */
export function useTemporaryValue<T>(duration = 2000): [T | null, (value: T) => void] {
  const [value, setValue] = useState<T | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const show = useCallback(
    (next: T) => {
      setValue(next);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setValue(null), duration);
    },
    [duration],
  );

  return [value, show];
}
