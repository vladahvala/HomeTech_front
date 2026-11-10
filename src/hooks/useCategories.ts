import { useEffect, useState } from 'react';
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

// Після змін в адмінці меню й сторінки каталогу мають перечитати категорії
let version = 0;
const listeners = new Set<() => void>();

/** Скинути кеш — викликає адмінка після зміни категорій (UC-ADM-CTG-01) */
export function invalidateCategories(): void {
  cache = null;
  version += 1;
  listeners.forEach((listener) => listener());
}

export function useCategories() {
  const [current, setCurrent] = useState(version);
  useEffect(() => {
    const listener = () => setCurrent(version);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return useAsync(loadCategories, [current]);
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
