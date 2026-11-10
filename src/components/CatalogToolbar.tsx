import type { SortOrder } from '../types';
import { pluralize, SORT_LABELS } from '../utils/labels';

interface CatalogToolbarProps {
  /** undefined — ще не відомо (перше завантаження) */
  total: number | undefined;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

/** Кількість знайдених товарів і вибір порядку (UC-CAT-02) */
export default function CatalogToolbar({ total, sort, onSortChange }: CatalogToolbarProps) {
  return (
    <div className="catalog-toolbar">
      <p className="catalog-toolbar__count" aria-live="polite">
        {total === undefined ? '\u00A0' : `Знайдено ${total} ${pluralize(total, ['товар', 'товари', 'товарів'])}`}
      </p>

      <label className="catalog-toolbar__sort">
        <span>Порядок:</span>
        <select
          className="catalog-toolbar__select"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOrder)}
        >
          {(Object.keys(SORT_LABELS) as SortOrder[]).map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
