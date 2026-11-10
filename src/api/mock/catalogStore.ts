// ТИМЧАСОВЕ сховище каталогу в localStorage — спільне для каталогу покупця,
// кошика, замовлень і адмінки. Справжній бекенд зберігає це в базі даних.

import type {
  Availability,
  Category,
  CharacteristicType,
  CharacteristicValue,
  Manufacturer,
  ProductSummary,
} from '../../types';
import { ApiError } from '../ApiError';
import { CATEGORIES, CHARACTERISTICS, MANUFACTURERS, PRODUCTS } from './catalogData';

// v2: шаблони імпорту стали регулярними виразами — старі демо-дані скидаються
const CATALOG_KEY = 'hometech-mock-catalog-v2';

export interface StoredCategory extends Category {
  hidden: boolean;
  importTemplate: string | null;
}

export interface StoredCharacteristic {
  id: number;
  categoryId: number;
  name: string;
  type: CharacteristicType;
  unit: string | null;
  isFilter: boolean;
  order: number;
  options: string[];
}

export interface StoredProduct {
  id: number;
  categoryId: number | null;
  manufacturerId: number | null;
  name: string;
  price: number | null;
  purchasePrice: number | null;
  availability: Availability;
  article: string | null;
  warrantyMonths: number | null;
  assemblyCountry: string | null;
  assemblyCity: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  /** Видалений товар лишається в базі заради архіву замовлень (FUN-08) */
  deleted: boolean;
  /** Код постачальника — є лише в товарів із прайсу Katran */
  supplierCode: string | null;
  ownImageUrl: string | null;
  supplierImageUrl: string | null;
  values: Record<number, CharacteristicValue>;
}

export interface CatalogState {
  categories: StoredCategory[];
  manufacturers: Manufacturer[];
  characteristics: StoredCharacteristic[];
  products: StoredProduct[];
}

export function loadCatalog(): CatalogState {
  try {
    const saved = localStorage.getItem(CATALOG_KEY);
    if (saved) return JSON.parse(saved) as CatalogState;
  } catch {
    // пошкоджені дані — починаємо зі стартового каталогу
  }
  const state = seedCatalog();
  saveCatalog(state);
  return state;
}

export function saveCatalog(state: CatalogState): void {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(state));
  } catch {
    // переповнене сховище браузера (найчастіше — через фото); справжній сервер цього не має
    throw new ApiError(
      507,
      'STORAGE_FULL',
      'Демо-сховище браузера переповнене. Видаліть кілька власних фото або очистіть дані сайту.',
    );
  }
}

export function nextId(items: { id: number }[]): number {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

/** Категорію видно в каталозі, якщо не приховано ні її, ні батьківську (UC-ADM-CTG-01) */
export function isCategoryVisible(state: CatalogState, categoryId: number | null): boolean {
  const category = state.categories.find((item) => item.id === categoryId);
  if (!category || category.hidden) return false;
  if (category.parentId === null) return true;
  return isCategoryVisible(state, category.parentId);
}

/** Товар бачить покупець: опублікований, не видалений, з ціною й видимою категорією */
export function isProductVisible(state: CatalogState, product: StoredProduct): boolean {
  return (
    product.published &&
    !product.deleted &&
    product.price !== null &&
    isCategoryVisible(state, product.categoryId)
  );
}

/** Власне фото, інакше фото з прайсу, інакше null — заглушка (FUN-10) */
export function productImage(product: StoredProduct): string | null {
  return product.ownImageUrl ?? product.supplierImageUrl;
}

export function toProductSummary(product: StoredProduct): ProductSummary {
  return {
    id: product.id,
    name: product.name,
    price: product.price ?? 0,
    availability: product.availability,
    imageUrl: productImage(product),
  };
}

// ----- Стартовий стан -----

// регулярні вирази для початку назви в прайсі (без урахування регістру), UC-SYS-02
const IMPORT_TEMPLATES: Record<string, string> = {
  fridges: 'Холодильник',
  kettles: '(Електро)?чайник',
  microwaves: 'Мікрохвильов(а|і) піч|Мікрохвильовка',
  hoods: 'Витяжка',
  vacuums: '(Робот-)?пилосос',
};

function seedCatalog(): CatalogState {
  const characteristics: StoredCharacteristic[] = CHARACTERISTICS.map((item) => {
    // варіанти переліку — усі значення, які вже є в товарах
    const options =
      item.type === 'enum'
        ? [...new Set(PRODUCTS.map((product) => product.values[item.id]).filter((value) => value !== undefined))]
            .map(String)
            .sort((a, b) => a.localeCompare(b, 'uk'))
        : [];
    return { ...item, options };
  });

  // кожен четвертий товар додано вручну, решта — з прайсу Katran
  const products: StoredProduct[] = PRODUCTS.map((product, index) => {
    const fromKatran = index % 4 !== 3;
    return {
      id: product.id,
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId,
      name: product.name,
      price: product.price,
      purchasePrice: fromKatran ? Math.round(product.price * 0.82) : null,
      availability: product.availability,
      article: product.article,
      warrantyMonths: product.warrantyMonths,
      assemblyCountry: product.assemblyCountry,
      assemblyCity: product.assemblyCity,
      description: product.description,
      createdAt: product.createdAt,
      updatedAt: product.createdAt,
      published: true,
      deleted: false,
      supplierCode: fromKatran ? `KT-${10000 + product.id}` : null,
      ownImageUrl: null,
      supplierImageUrl: product.imageUrl,
      values: { ...product.values },
    };
  });

  // кілька товарів, які чекають на Адміністратора: щойно імпортовані приховані й без категорії
  const now = Date.now();
  const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString();
  const extra: Omit<StoredProduct, 'id'>[] = [
    {
      categoryId: 3, manufacturerId: 7, name: 'Електрочайник Tefal KO2501 1,7 л', price: 1649, purchasePrice: 1290,
      availability: 'in_stock', article: 'KO2501', warrantyMonths: 12, assemblyCountry: null, assemblyCity: null,
      description: '', createdAt: hoursAgo(5), updatedAt: hoursAgo(5), published: false, deleted: false,
      supplierCode: 'KT-20117', ownImageUrl: null, supplierImageUrl: null, values: {},
    },
    {
      categoryId: 1, manufacturerId: 4, name: 'Холодильник Gorenje NRK6192AW4 302 л', price: 18999, purchasePrice: 15400,
      availability: 'expected', article: 'NRK6192AW4', warrantyMonths: 24, assemblyCountry: null, assemblyCity: null,
      description: '', createdAt: hoursAgo(5), updatedAt: hoursAgo(5), published: false, deleted: false,
      supplierCode: 'KT-20118', ownImageUrl: null, supplierImageUrl: null, values: {},
    },
    {
      categoryId: null, manufacturerId: 6, name: 'Блендер Philips HR2602/90', price: 1899, purchasePrice: null,
      availability: 'in_stock', article: 'HR2602/90', warrantyMonths: 24, assemblyCountry: 'Китай', assemblyCity: null,
      description: 'Стаціонарний блендер, чаша 1 л.', createdAt: hoursAgo(26), updatedAt: hoursAgo(26),
      published: false, deleted: false, supplierCode: null, ownImageUrl: null, supplierImageUrl: null, values: {},
    },
    {
      categoryId: null, manufacturerId: null, name: 'Мультиварка (уточнити модель)', price: null, purchasePrice: null,
      availability: 'expected', article: null, warrantyMonths: null, assemblyCountry: null, assemblyCity: null,
      description: '', createdAt: hoursAgo(30), updatedAt: hoursAgo(30), published: false, deleted: false,
      supplierCode: null, ownImageUrl: null, supplierImageUrl: null, values: {},
    },
  ];
  for (const item of extra) products.push({ ...item, id: nextId(products) });

  return {
    categories: CATEGORIES.map((category) => ({
      ...category,
      hidden: false,
      importTemplate: IMPORT_TEMPLATES[category.slug] ?? null,
    })),
    manufacturers: MANUFACTURERS.map((item) => ({ ...item })),
    characteristics,
    products,
  };
}
