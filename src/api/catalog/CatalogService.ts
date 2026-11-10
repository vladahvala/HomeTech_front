import type {
  Category,
  CategoryFilters,
  Page,
  ProductDetails,
  ProductQuery,
  ProductSummary,
} from '../../types';

/** Скільки товарів на сторінці (UC-CAT-01, UC-CAT-03) */
export const PAGE_SIZE = 20;

/** Скільки акційних товарів у каруселі на головній */
export const PROMOTIONS_LIMIT = 12;

/**
 * Каталог для покупця. Віддає лише видимі категорії й товари —
 * що саме видиме, вирішує бекенд.
 */
export interface CatalogService {
  /** Усі видимі категорії обох рівнів */
  getCategories(): Promise<Category[]>;
  /** Варіанти фільтрів категорії (UC-CAT-02) */
  getFilters(categorySlug: string): Promise<CategoryFilters>;
  /** Список товарів з фільтрами, сортуванням, пошуком і сторінками */
  getProducts(query: ProductQuery): Promise<Page<ProductSummary>>;
  /** Акційні товари для каруселі на головній: спершу з більшою знижкою, до 12 */
  getPromotions(): Promise<ProductSummary[]>;
  /** Картка товару; ApiError 404, якщо товару немає або він прихований */
  getProduct(id: number): Promise<ProductDetails>;
}
