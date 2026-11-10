import { useCallback, useEffect, useRef, useState } from 'react';
import { mod } from '../utils/format';

interface SliderOptions {
  initialIndex?: number;
  interval?: number;
}

export function useSlider(count: number, { initialIndex = 0, interval = 4000 }: SliderOptions = {}) {
  const [current, setCurrent] = useState(() => (count > 0 ? mod(initialIndex, count) : 0));
  const timerRef = useRef<number | null>(null);

  const goTo = useCallback((index: number) => {
    if (count > 0) setCurrent(mod(index, count));
  }, [count]);

  const next = useCallback(() => {
    if (count > 0) setCurrent((v) => mod(v + 1, count));
  }, [count]);

  const prev = useCallback(() => {
    if (count > 0) setCurrent((v) => mod(v - 1, count));
  }, [count]);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (count < 2) return;
    timerRef.current = window.setInterval(next, interval);
  }, [count, interval, next, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  return { current, goTo, next, prev, startAutoplay, stopAutoplay };
}