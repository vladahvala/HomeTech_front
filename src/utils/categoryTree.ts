import type { Category } from '../types';

export interface CategoryTreeRow<T extends Category> {
  category: T;
  /** 0 — верхній рівень, 1 — підкатегорія */
  depth: 0 | 1;
  parent: T | null;
}

const byOrder = (a: Category, b: Category) => a.order - b.order || a.name.localeCompare(b.name, 'uk');

/** Категорії деревом у порядку показу: батьківська, під нею її підкатегорії */
export function categoryTree<T extends Category>(categories: T[]): CategoryTreeRow<T>[] {
  const rows: CategoryTreeRow<T>[] = [];
  const top = categories.filter((item) => item.parentId === null).sort(byOrder);
  for (const parent of top) {
    rows.push({ category: parent, depth: 0, parent: null });
    categories
      .filter((item) => item.parentId === parent.id)
      .sort(byOrder)
      .forEach((child) => rows.push({ category: child, depth: 1, parent }));
  }
  return rows;
}

/** «Кухонна техніка → Чайники» */
export function categoryLabel<T extends Category>(row: CategoryTreeRow<T>): string {
  return row.parent ? `${row.parent.name} → ${row.category.name}` : row.category.name;
}
