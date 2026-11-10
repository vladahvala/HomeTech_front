import type {
  Category,
  CategoryFilters,
  Page,
  ProductDetails,
  ProductQuery,
  ProductSummary,
} from '../../types';
import { toSearchParams } from '../../utils/catalogQuery';
import type { ApiClient } from '../ApiClient';
import type { CatalogService } from './CatalogService';

/** Каталог через справжній бекенд (опис запитів — docs/API.md) */
export class HttpCatalogService implements CatalogService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  getCategories(): Promise<Category[]> {
    return this.api.get<Category[]>('/catalog/categories');
  }

  getFilters(categorySlug: string): Promise<CategoryFilters> {
    return this.api.get<CategoryFilters>(
      `/catalog/categories/${encodeURIComponent(categorySlug)}/filters`,
    );
  }

  getProducts(query: ProductQuery): Promise<Page<ProductSummary>> {
    const params = toSearchParams(query, true);
    return this.api.get<Page<ProductSummary>>(`/catalog/products?${params}`);
  }

  getPromotions(): Promise<ProductSummary[]> {
    return this.api.get<ProductSummary[]>('/catalog/promotions');
  }

  getProduct(id: number): Promise<ProductDetails> {
    return this.api.get<ProductDetails>(`/catalog/products/${id}`);
  }
}
