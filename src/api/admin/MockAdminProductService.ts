import type {
  AdminProduct,
  AdminProductListItem,
  AdminProductQuery,
  CharacteristicValue,
  Page,
  ProductInput,
} from '../../types';
import { kyivToday } from '../../utils/dates';
import { validatePhoto, validateProductInput } from '../../validation/rules';
import { ApiError } from '../ApiError';
import { hasActivePromo, loadCatalog, nextId, productImage, saveCatalog } from '../mock/catalogStore';
import type { CatalogState, StoredProduct } from '../mock/catalogStore';
import type { AdminProductService } from './AdminProductService';
import { delay, notFound, requireAdmin, sameName } from './mockAdmin';

// ТИМЧАСОВО, поки немає бекенду. Правила — як має робити бекенд за UC-ADM-PRD-01…05.

const PAGE_SIZE = 20;

function findProduct(state: CatalogState, id: number): StoredProduct {
  const product = state.products.find((item) => item.id === id && !item.deleted);
  if (!product) throw notFound('Товар');
  return product;
}

function toAdminProduct(state: CatalogState, product: StoredProduct): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    availability: product.availability,
    categoryId: product.categoryId,
    manufacturer: state.manufacturers.find((item) => item.id === product.manufacturerId) ?? null,
    article: product.article,
    price: product.price,
    purchasePrice: product.purchasePrice,
    warrantyMonths: product.warrantyMonths,
    description: product.description,
    assemblyCountry: product.assemblyCountry,
    assemblyCity: product.assemblyCity,
    values: { ...product.values },
    published: product.published,
    source: product.supplierCode ? 'katran' : 'manual',
    supplierCode: product.supplierCode,
    ownImageUrl: product.ownImageUrl,
    supplierImageUrl: product.supplierImageUrl,
    promoPrice: product.promoPrice ?? null,
    promoUntil: product.promoUntil ?? null,
    promoActive: hasActivePromo(product),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function toListItem(state: CatalogState, product: StoredProduct): AdminProductListItem {
  return {
    id: product.id,
    name: product.name,
    article: product.article,
    supplierCode: product.supplierCode,
    source: product.supplierCode ? 'katran' : 'manual',
    categoryId: product.categoryId,
    categoryName: state.categories.find((item) => item.id === product.categoryId)?.name ?? null,
    manufacturerName: state.manufacturers.find((item) => item.id === product.manufacturerId)?.name ?? null,
    price: product.price,
    purchasePrice: product.purchasePrice,
    promoPrice: hasActivePromo(product) ? product.promoPrice : null,
    promoUntil: hasActivePromo(product) ? (product.promoUntil ?? null) : null,
    availability: product.availability,
    published: product.published,
    imageUrl: productImage(product),
    updatedAt: product.updatedAt,
  };
}

/** Чого бракує для публікації (UC-ADM-PRD-05) */
function missingForPublish(product: Pick<StoredProduct, 'categoryId' | 'price'>): string[] {
  const missing: string[] = [];
  if (product.categoryId === null) missing.push('категорію');
  if (product.price === null) missing.push('ціну');
  return missing;
}

/**
 * Перевіряє форму й повертає поля товару. Значення характеристик лишаються
 * лише за шаблоном обраної категорії — так зникають значення попередньої (UC-ADM-PRD-03).
 */
function applyInput(state: CatalogState, input: ProductInput) {
  const template = state.characteristics.filter((item) => item.categoryId === input.categoryId);
  const errors = validateProductInput(input, template, kyivToday());

  if (input.categoryId !== null) {
    const category = state.categories.find((item) => item.id === input.categoryId);
    if (!category) errors.categoryId = 'Такої категорії немає. Оновіть сторінку й оберіть іншу.';
    else if (state.categories.some((item) => item.parentId === category.id)) {
      errors.categoryId = 'Товари додають лише до категорії без підкатегорій. Оберіть підкатегорію.';
    }
  }
  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', errors);
  }

  // виробник за назвою без урахування регістру; нова назва — новий виробник (UC-ADM-PRD-02)
  let manufacturerId: number | null = null;
  const manufacturerName = input.manufacturerName.trim();
  if (manufacturerName) {
    const existing = state.manufacturers.find((item) => sameName(item.name, manufacturerName));
    if (existing) manufacturerId = existing.id;
    else {
      manufacturerId = nextId(state.manufacturers);
      state.manufacturers.push({ id: manufacturerId, name: manufacturerName, country: null });
    }
  }

  const values: Record<number, CharacteristicValue> = {};
  for (const item of template) {
    const value = input.values[item.id];
    if (value !== undefined) values[item.id] = typeof value === 'string' ? value.trim() : value;
  }

  const text = (value: string) => value.trim() || null;
  return {
    name: input.name.trim(),
    availability: input.availability,
    categoryId: input.categoryId,
    manufacturerId,
    article: text(input.article),
    price: input.price,
    warrantyMonths: input.warrantyMonths,
    description: input.description.trim(),
    assemblyCountry: text(input.assemblyCountry),
    assemblyCity: text(input.assemblyCity),
    values,
    promoPrice: input.promoPrice,
    promoUntil: input.promoPrice === null ? null : input.promoUntil || null,
  };
}

/** Зменшує фото до 800 px, щоб демо-сховище браузера не переповнилось (сервер зберігає файл) */
async function photoToDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('decode'));
      element.src = url;
    });
    const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    context.fillStyle = '#ffffff'; // прозорий PNG — на білому тлі
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    throw new ApiError(400, 'INVALID_PHOTO', 'Не вдалося прочитати фото. Перевірте, що файл не пошкоджений.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export class MockAdminProductService implements AdminProductService {
  async listProducts(query: AdminProductQuery): Promise<Page<AdminProductListItem>> {
    await delay(250);
    requireAdmin();
    const state = loadCatalog();

    // кожне слово — у назві, артикулі або коді постачальника
    const words = (query.search ?? '').toLocaleLowerCase('uk').split(/\s+/).filter(Boolean);
    const childIds = (id: number) => state.categories.filter((item) => item.parentId === id).map((item) => item.id);

    const list = state.products
      .filter((product) => !product.deleted)
      .filter((product) => {
        if (!words.length) return true;
        const haystack = [product.name, product.article, product.supplierCode].join(' ').toLocaleLowerCase('uk');
        return words.every((word) => haystack.includes(word));
      })
      .filter((product) => {
        if (query.category === undefined) return true;
        if (query.category === 'none') return product.categoryId === null;
        return product.categoryId !== null && [query.category, ...childIds(query.category)].includes(product.categoryId);
      })
      .filter((product) => query.manufacturer === undefined || product.manufacturerId === query.manufacturer)
      .filter((product) => query.published === undefined || product.published === query.published)
      .filter((product) => !query.availability || product.availability === query.availability)
      .filter((product) => !query.source || (product.supplierCode ? 'katran' : 'manual') === query.source)
      .filter((product) => query.promo === undefined || hasActivePromo(product) === query.promo)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);

    const start = (query.page - 1) * PAGE_SIZE;
    return {
      items: list.slice(start, start + PAGE_SIZE).map((product) => toListItem(state, product)),
      total: list.length,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  }

  async getProduct(id: number): Promise<AdminProduct> {
    await delay(250);
    requireAdmin();
    const state = loadCatalog();
    return toAdminProduct(state, findProduct(state, id));
  }

  async createProduct(input: ProductInput): Promise<AdminProduct> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const fields = applyInput(state, input);
    const now = new Date().toISOString();
    const product: StoredProduct = {
      id: nextId(state.products),
      ...fields,
      purchasePrice: null,
      createdAt: now,
      updatedAt: now,
      // товар з категорією й ціною одразу публікується (UC-ADM-PRD-02)
      published: missingForPublish(fields).length === 0,
      deleted: false,
      supplierCode: null,
      ownImageUrl: null,
      supplierImageUrl: null,
    };
    state.products.push(product);
    saveCatalog(state);
    return toAdminProduct(state, product);
  }

  async updateProduct(id: number, input: ProductInput): Promise<AdminProduct> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const product = findProduct(state, id);
    Object.assign(product, applyInput(state, input), { updatedAt: new Date().toISOString() });
    // без категорії чи ціни товар не може лишатися в каталозі
    if (missingForPublish(product).length > 0) product.published = false;
    saveCatalog(state);
    return toAdminProduct(state, product);
  }

  async setPublished(id: number, published: boolean): Promise<AdminProduct> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const product = findProduct(state, id);
    const missing = missingForPublish(product);
    if (published && missing.length > 0) {
      throw new ApiError(
        400,
        'CANNOT_PUBLISH',
        `Щоб опублікувати «${product.name}», вкажіть ${missing.join(' й ')} у формі товару.`,
      );
    }
    product.published = published;
    product.updatedAt = new Date().toISOString();
    saveCatalog(state);
    return toAdminProduct(state, product);
  }

  async deleteProduct(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const product = findProduct(state, id);
    // позначка замість видалення: замовлення зберігають позиції, імпорт пропускає товар (FUN-08)
    product.deleted = true;
    product.updatedAt = new Date().toISOString();
    saveCatalog(state);
  }

  async uploadPhoto(id: number, file: File): Promise<AdminProduct> {
    await delay();
    requireAdmin();
    const message = validatePhoto(file);
    if (message) throw new ApiError(400, 'INVALID_PHOTO', message);
    const dataUrl = await photoToDataUrl(file);
    const state = loadCatalog();
    const product = findProduct(state, id);
    product.ownImageUrl = dataUrl;
    product.updatedAt = new Date().toISOString();
    saveCatalog(state);
    return toAdminProduct(state, product);
  }

  async deletePhoto(id: number): Promise<AdminProduct> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const product = findProduct(state, id);
    product.ownImageUrl = null;
    product.updatedAt = new Date().toISOString();
    saveCatalog(state);
    return toAdminProduct(state, product);
  }
}
