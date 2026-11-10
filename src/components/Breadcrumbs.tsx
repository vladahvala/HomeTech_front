import { Fragment } from 'react';
import { Link } from 'react-router';

export interface Crumb {
  label: string;
  /** Без посилання — поточна сторінка */
  to?: string;
}

/** «Головна / Кухонна техніка / Чайники» */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Ви тут">
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 && <span className="breadcrumbs__separator">/</span>}
          {item.to ? (
            <Link className="breadcrumbs__link" to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumbs__current" aria-current="page">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
