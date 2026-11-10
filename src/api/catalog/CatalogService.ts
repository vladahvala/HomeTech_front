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
  /** Картка товару; ApiError 404, якщо товару немає або він прихований */
  getProduct(id: number): Promise<ProductDetails>;
}
