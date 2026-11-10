import { useCallback, useEffect, useRef, useState } from 'react';

/** Прапорець, який сам скидається через duration мс (наприклад, «Додано в кошик ✓») */
export function useTemporaryFlag(duration = 2000): [boolean, () => void] {
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const trigger = useCallback(() => {
    setIsActive(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setIsActive(false), duration);
  }, [duration]);

  return [isActive, trigger];
}
