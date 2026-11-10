import { Link } from 'react-router';

interface PagerProps {
  currentPage: number;
  totalPages: number;
  /** Адреса сторінки N — посилання, щоб працювали «Назад» і відкриття в новій вкладці */
  hrefFor: (page: number) => string;
}

type PagerItem = number | 'gap';

/** 1 … 4 5 [6] 7 8 … 40 — перша, остання й сусіди поточної */
function buildItems(current: number, total: number): PagerItem[] {
  const pages = new Set([1, total, current - 2, current - 1, current, current + 1, current + 2]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const items: PagerItem[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push('gap');
    items.push(page);
  });
  return items;
}

export default function Pager({ currentPage, totalPages, hrefFor }: PagerProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pager" aria-label="Сторінки каталогу">
      {currentPage > 1 && (
        <Link className="pager__link" to={hrefFor(currentPage - 1)} aria-label="Попередня сторінка">
          ‹
        </Link>
      )}

      {buildItems(currentPage, totalPages).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="pager__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={item}
            className={`pager__link${item === currentPage ? ' pager__link--active' : ''}`}
            to={hrefFor(item)}
            aria-current={item === currentPage ? 'page' : undefined}
            aria-label={`Сторінка ${item}`}
          >
            {item}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link className="pager__link" to={hrefFor(currentPage + 1)} aria-label="Наступна сторінка">
          ›
        </Link>
      )}
    </nav>
  );
}
