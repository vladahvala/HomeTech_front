import { useEffect } from 'react';
import { SITE_NAME, SITE_TITLE } from '../data/site';

/** Заголовок вкладки браузера: «Чайники — ДомТех» */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_TITLE;
    return () => {
      document.title = SITE_TITLE;
    };
  }, [title]);
}
