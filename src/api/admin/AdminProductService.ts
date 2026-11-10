import type { AdminProduct, AdminProductListItem, AdminProductQuery, Page, ProductInput } from '../../types';

/**
 * Товари магазину для Адміністратора (UC-ADM-PRD-01…05).
 * Помилки (ApiError.code):
 * - VALIDATION_ERROR (400) — поля форми в fields (name, price, categoryId, value-<id>…);
 * - CANNOT_PUBLISH (400) — бракує категорії чи ціни (UC-ADM-PRD-05);
 * - INVALID_PHOTO (400) — не JPEG/PNG/WebP або більше 5 МБ;
 * - NOT_FOUND (404) — товару немає або його видалено.
 */
export interface AdminProductService {
  /** Невидалені товари, нещодавно змінені першими, по 20 */
  listProducts(query: AdminProductQuery): Promise<Page<AdminProductListItem>>;
  getProduct(id: number): Promise<AdminProduct>;
  /** Створює товар без коду постачальника; з категорією й ціною — одразу публікує */
  createProduct(input: ProductInput): Promise<AdminProduct>;
  updateProduct(id: number, input: ProductInput): Promise<AdminProduct>;
  setPublished(id: number, published: boolean): Promise<AdminProduct>;
  /** Позначає видаленим; позиції замовлень зберігаються (FUN-08) */
  deleteProduct(id: number): Promise<void>;
  uploadPhoto(id: number, file: File): Promise<AdminProduct>;
  deletePhoto(id: number): Promise<AdminProduct>;
}
