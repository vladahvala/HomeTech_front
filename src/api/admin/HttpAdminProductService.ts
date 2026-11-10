import type { AdminProduct, AdminProductListItem, AdminProductQuery, Page, ProductInput } from '../../types';
import { toAdminProductParams } from '../../utils/adminProductQuery';
import type { ApiClient } from '../ApiClient';
import type { AdminProductService } from './AdminProductService';

/** Товари через справжній бекенд (опис запитів — docs/API.md) */
export class HttpAdminProductService implements AdminProductService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  listProducts(query: AdminProductQuery): Promise<Page<AdminProductListItem>> {
    return this.api.get<Page<AdminProductListItem>>(`/admin/products?${toAdminProductParams(query)}`);
  }

  getProduct(id: number): Promise<AdminProduct> {
    return this.api.get<AdminProduct>(`/admin/products/${id}`);
  }

  createProduct(input: ProductInput): Promise<AdminProduct> {
    return this.api.post<AdminProduct>('/admin/products', input);
  }

  updateProduct(id: number, input: ProductInput): Promise<AdminProduct> {
    return this.api.put<AdminProduct>(`/admin/products/${id}`, input);
  }

  setPublished(id: number, published: boolean): Promise<AdminProduct> {
    return this.api.patch<AdminProduct>(`/admin/products/${id}/publication`, { published });
  }

  deleteProduct(id: number): Promise<void> {
    return this.api.delete<void>(`/admin/products/${id}`);
  }

  uploadPhoto(id: number, file: File): Promise<AdminProduct> {
    const form = new FormData();
    form.append('photo', file);
    return this.api.upload<AdminProduct>(`/admin/products/${id}/photo`, form);
  }

  deletePhoto(id: number): Promise<AdminProduct> {
    return this.api.delete<AdminProduct>(`/admin/products/${id}/photo`);
  }
}
