import type { MouseEvent } from 'react';

interface PagerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  minLinks?: number; // як у макеті: завжди 3 кнопки, зайві неактивні
}

export default function Pager({ currentPage, totalPages, onPageChange, minLinks = 3 }: PagerProps) {
  const pages = Array.from({ length: Math.max(totalPages, minLinks) }, (_, i) => i + 1);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, page: number) => {
    event.preventDefault();
    if (page <= totalPages) onPageChange(page);
  };

  return (
    <nav className="pager" aria-label="Сторінки каталогу">
      {pages.map((page) => {
        const isActive = page === currentPage;
        const isDisabled = page > totalPages;
        const classes = ['pager__link'];
        if (isActive) classes.push('pager__link--active');
        if (isDisabled) classes.push('pager__link--disabled');
        return (
          <a key={page} href="#" className={classes.join(' ')}
            aria-current={isActive ? 'page' : undefined}
            aria-disabled={isDisabled || undefined}
            tabIndex={isDisabled ? -1 : undefined}
            onClick={(event) => handleClick(event, page)}>
            {page}
          </a>
        );
      })}
    </nav>
  );
}