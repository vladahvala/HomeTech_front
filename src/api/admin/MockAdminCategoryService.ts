import type { AdminCategory, CategoryInput, Characteristic, CharacteristicInput } from '../../types';
import { validateCategoryInput, validateCharacteristicInput } from '../../validation/rules';
import { ApiError } from '../ApiError';
import type { FieldErrors } from '../ApiError';
import { loadCatalog, nextId, saveCatalog } from '../mock/catalogStore';
import type { CatalogState, StoredCategory, StoredCharacteristic } from '../mock/catalogStore';
import type { AdminCategoryService } from './AdminCategoryService';
import { delay, notFound, requireAdmin, sameName } from './mockAdmin';

// ТИМЧАСОВО, поки немає бекенду. Правила — як має робити бекенд за UC-ADM-CTG-01, 02.

const productsIn = (state: CatalogState, categoryId: number) =>
  state.products.filter((product) => !product.deleted && product.categoryId === categoryId);

const childrenOf = (state: CatalogState, categoryId: number) =>
  state.categories.filter((item) => item.parentId === categoryId);

function toAdminCategory(state: CatalogState, category: StoredCategory): AdminCategory {
  return {
    ...category,
    productsCount: productsIn(state, category.id).length,
    childrenCount: childrenOf(state, category.id).length,
  };
}

function toCharacteristic(state: CatalogState, item: StoredCharacteristic): Characteristic {
  return {
    ...item,
    options: [...item.options],
    valuesCount: state.products.filter((product) => !product.deleted && product.values[item.id] !== undefined).length,
  };
}

function findCategory(state: CatalogState, id: number): StoredCategory {
  const category = state.categories.find((item) => item.id === id);
  if (!category) throw notFound('Категорію');
  return category;
}

function findCharacteristic(state: CatalogState, id: number): StoredCharacteristic {
  const item = state.characteristics.find((characteristic) => characteristic.id === id);
  if (!item) throw notFound('Характеристику');
  return item;
}

function throwIfErrors(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', errors);
  }
}

/** Перевірки категорії, яких не зробити на клієнті: унікальність і два рівні */
function checkCategory(state: CatalogState, input: CategoryInput, selfId: number | null): StoredCategory | null {
  throwIfErrors(validateCategoryInput(input));
  const others = state.categories.filter((item) => item.id !== selfId);

  const nameOwner = others.find((item) => sameName(item.name, input.name));
  if (nameOwner) {
    const message = `Категорія «${nameOwner.name}» уже є. Назва має бути унікальною.`;
    throw new ApiError(409, 'NAME_TAKEN', message, { name: message });
  }
  if (others.some((item) => item.slug === input.slug.trim())) {
    const message = 'Цей ідентифікатор уже має інша категорія. Придумайте інший.';
    throw new ApiError(409, 'SLUG_TAKEN', message, { slug: message });
  }

  if (input.parentId === null) return null;
  const fail = (message: string) => {
    throw new ApiError(400, 'VALIDATION_ERROR', message, { parentId: message });
  };
  const parent = state.categories.find((item) => item.id === input.parentId);
  if (!parent || parent.id === selfId) return fail('Оберіть іншу батьківську категорію.');
  // два рівні: батьківська — лише верхнього рівня, а категорія з підкатегоріями не стає дочірньою
  if (parent.parentId !== null) return fail('Підкатегорію не можна зробити батьківською — у каталозі два рівні.');
  if (selfId !== null && childrenOf(state, selfId).length > 0) {
    return fail('У цієї категорії є підкатегорії, тож вона може бути лише верхнього рівня.');
  }
  // товари призначають категоріям без підкатегорій
  const count = productsIn(state, parent.id).length;
  if (count > 0) {
    return fail(`У категорії «${parent.name}» є товари (${count}). Підкатегорії додають лише до категорії без товарів.`);
  }
  return parent;
}

/** Перевірки характеристики: унікальна назва в категорії */
function checkCharacteristic(state: CatalogState, categoryId: number, input: CharacteristicInput, selfId: number | null) {
  throwIfErrors(validateCharacteristicInput(input));
  const duplicate = state.characteristics.find(
    (item) => item.categoryId === categoryId && item.id !== selfId && sameName(item.name, input.name),
  );
  if (duplicate) {
    const message = `Характеристика «${duplicate.name}» у цій категорії вже є.`;
    throw new ApiError(409, 'NAME_TAKEN', message, { name: message });
  }
}

function normalizeCharacteristic(input: CharacteristicInput) {
  return {
    name: input.name.trim(),
    type: input.type,
    unit: input.unit?.trim() || null,
    isFilter: input.isFilter,
    order: input.order,
    options: input.type === 'enum' ? input.options.map((option) => option.trim()).filter(Boolean) : [],
  };
}

export class MockAdminCategoryService implements AdminCategoryService {
  async listCategories(): Promise<AdminCategory[]> {
    await delay(200);
    requireAdmin();
    const state = loadCatalog();
    return state.categories.map((category) => toAdminCategory(state, category));
  }

  async createCategory(input: CategoryInput): Promise<AdminCategory> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    checkCategory(state, input, null);
    const category: StoredCategory = {
      id: nextId(state.categories),
      name: input.name.trim(),
      slug: input.slug.trim(),
      parentId: input.parentId,
      order: input.order,
      hidden: input.hidden,
      importTemplate: input.importTemplate?.trim() || null,
    };
    state.categories.push(category);
    saveCatalog(state);
    return toAdminCategory(state, category);
  }

  async updateCategory(id: number, input: CategoryInput): Promise<AdminCategory> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const category = findCategory(state, id);
    checkCategory(state, input, id);
    // прихована категорія ховає підкатегорії й товари, не змінюючи їхніх ознак публікації
    Object.assign(category, {
      name: input.name.trim(),
      slug: input.slug.trim(),
      parentId: input.parentId,
      order: input.order,
      hidden: input.hidden,
      importTemplate: input.importTemplate?.trim() || null,
    });
    saveCatalog(state);
    return toAdminCategory(state, category);
  }

  async deleteCategory(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const category = findCategory(state, id);
    const children = childrenOf(state, id).length;
    const products = productsIn(state, id).length;
    if (children > 0) {
      throw new ApiError(409, 'CATEGORY_NOT_EMPTY', `У «${category.name}» є підкатегорії (${children}). Спершу видаліть або перенесіть їх.`);
    }
    if (products > 0) {
      throw new ApiError(409, 'CATEGORY_NOT_EMPTY', `У «${category.name}» є товари (${products}). Перенесіть їх в іншу категорію.`);
    }
    state.categories = state.categories.filter((item) => item.id !== id);
    state.characteristics = state.characteristics.filter((item) => item.categoryId !== id);
    saveCatalog(state);
  }

  async listCharacteristics(categoryId: number): Promise<Characteristic[]> {
    await delay(200);
    requireAdmin();
    const state = loadCatalog();
    findCategory(state, categoryId);
    return state.characteristics
      .filter((item) => item.categoryId === categoryId)
      .sort((a, b) => a.order - b.order || a.id - b.id)
      .map((item) => toCharacteristic(state, item));
  }

  async createCharacteristic(categoryId: number, input: CharacteristicInput): Promise<Characteristic> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    findCategory(state, categoryId);
    if (childrenOf(state, categoryId).length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Шаблон задають категорії без підкатегорій — саме їм призначають товари.');
    }
    checkCharacteristic(state, categoryId, input, null);
    const item: StoredCharacteristic = { id: nextId(state.characteristics), categoryId, ...normalizeCharacteristic(input) };
    state.characteristics.push(item);
    saveCatalog(state);
    return toCharacteristic(state, item);
  }

  async updateCharacteristic(id: number, input: CharacteristicInput): Promise<Characteristic> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const item = findCharacteristic(state, id);
    checkCharacteristic(state, item.categoryId, input, id);

    const withValue = state.products.filter((product) => !product.deleted && product.values[id] !== undefined);
    if (input.type !== item.type && withValue.length > 0) {
      const message = `Тип не змінюють: товарів зі значенням — ${withValue.length}. Видаліть характеристику й створіть заново.`;
      throw new ApiError(409, 'TYPE_LOCKED', message, { type: message });
    }
    const next = normalizeCharacteristic(input);
    if (item.type === 'enum' && next.type === 'enum') {
      const removedInUse = item.options.find(
        (option) => !next.options.includes(option) && withValue.some((product) => product.values[id] === option),
      );
      if (removedInUse) {
        const count = withValue.filter((product) => product.values[id] === removedInUse).length;
        const message = `Варіант «${removedInUse}» використовують товари (${count}). Спершу змініть його в цих товарах.`;
        throw new ApiError(409, 'OPTION_IN_USE', message, { options: message });
      }
    }
    Object.assign(item, next);
    saveCatalog(state);
    return toCharacteristic(state, item);
  }

  async deleteCharacteristic(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    findCharacteristic(state, id);
    state.characteristics = state.characteristics.filter((item) => item.id !== id);
    for (const product of state.products) delete product.values[id];
    saveCatalog(state);
  }
}
