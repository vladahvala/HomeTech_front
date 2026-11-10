import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Викликає onOutside, коли користувач натискає поза елементом ref.
 * Слухаємо pointerdown, а не click: інакше натискання на кнопку, яка сама
 * зникає (наприклад, «видалити» в кошику), рахувалося б як клік ззовні.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) {
        onOutside();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, onOutside, enabled]);
}