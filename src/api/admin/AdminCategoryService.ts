import type { AdminCategory, CategoryInput, Characteristic, CharacteristicInput } from '../../types';

/**
 * Категорії й шаблони характеристик (UC-ADM-CTG-01, 02).
 * Помилки (ApiError.code):
 * - VALIDATION_ERROR (400) — поля в fields;
 * - NAME_TAKEN, SLUG_TAKEN (409) — назва чи ідентифікатор уже зайняті (fields.name / fields.slug);
 * - CATEGORY_NOT_EMPTY (409) — у категорії є товари або підкатегорії;
 * - TYPE_LOCKED (409) — тип характеристики, що має значення в товарах, не змінюють;
 * - OPTION_IN_USE (409) — варіант переліку, який прибирають, мають товари.
 */
export interface AdminCategoryService {
  /** Усі категорії обох рівнів, разом із прихованими */
  listCategories(): Promise<AdminCategory[]>;
  createCategory(input: CategoryInput): Promise<AdminCategory>;
  updateCategory(id: number, input: CategoryInput): Promise<AdminCategory>;
  /** Лише категорію без товарів і підкатегорій */
  deleteCategory(id: number): Promise<void>;

  /** Шаблон категорії в порядку показу, з кількістю товарів зі значенням */
  listCharacteristics(categoryId: number): Promise<Characteristic[]>;
  createCharacteristic(categoryId: number, input: CharacteristicInput): Promise<Characteristic>;
  updateCharacteristic(id: number, input: CharacteristicInput): Promise<Characteristic>;
  /** Разом зі значеннями в товарах */
  deleteCharacteristic(id: number): Promise<void>;
}
