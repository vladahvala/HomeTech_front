import { catalogService } from '../api';
import type { Category } from '../types';
import { useAsync } from './useAsync';

// Категорії потрібні меню, сторінці категорії й картці товару одночасно,
// тому завантажуємо їх один раз і ділимося результатом.
let cache: Promise<Category[]> | null = null;

function loadCategories(): Promise<Category[]> {
  if (!cache) {
    cache = catalogService.getCategories().catch((error: unknown) => {
      cache = null; // після помилки наступна спроба піде на сервер знову
      throw error;
    });
  }
  return cache;
}

export function useCategories() {
  return useAsync(loadCategories, []);
}

/** Батьківська категорія (якщо є) і сама категорія — для хлібних крихт */
export function getCategoryPath(categories: Category[], categoryId: number): Category[] {
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return [];
  const parent = categories.find((item) => item.id === category.parentId);
  return parent ? [parent, category] : [category];
}

/** Видимі підкатегорії в порядку показу */
export function getChildren(categories: Category[], parentId: number | null): Category[] {
  return categories
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}
