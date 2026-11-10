import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Після переходу між сторінками прокручує вгору,
 * а для посилань на кшталт «/#catalog» — до потрібного розділу.
 * Зміна фільтрів (state.keepScroll) лишає прокрутку на місці.
 */
export default function ScrollManager() {
  const { pathname, hash, key, state } = useLocation();
  const keepScroll = (state as { keepScroll?: boolean } | null)?.keepScroll === true;

  useEffect(() => {
    if (keepScroll) return;

    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
    // key змінюється при кожному переході, тож повторний клік на «Головна» теж прокручує вгору
  }, [pathname, hash, key, keepScroll]);

  return null;
}
