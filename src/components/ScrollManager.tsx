import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Після переходу між сторінками прокручує вгору,
 * а для посилань на кшталт «/#catalog» — до потрібного розділу.
 */
export default function ScrollManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, key]);

  return null;
}