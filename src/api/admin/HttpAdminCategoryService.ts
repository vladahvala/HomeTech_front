import type { AdminCategory, CategoryInput, Characteristic, CharacteristicInput } from '../../types';
import type { ApiClient } from '../ApiClient';
import type { AdminCategoryService } from './AdminCategoryService';

/** Категорії й шаблони через справжній бекенд (опис запитів — docs/API.md) */
export class HttpAdminCategoryService implements AdminCategoryService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  listCategories(): Promise<AdminCategory[]> {
    return this.api.get<AdminCategory[]>('/admin/categories');
  }

  createCategory(input: CategoryInput): Promise<AdminCategory> {
    return this.api.post<AdminCategory>('/admin/categories', input);
  }

  updateCategory(id: number, input: CategoryInput): Promise<AdminCategory> {
    return this.api.put<AdminCategory>(`/admin/categories/${id}`, input);
  }

  deleteCategory(id: number): Promise<void> {
    return this.api.delete<void>(`/admin/categories/${id}`);
  }

  listCharacteristics(categoryId: number): Promise<Characteristic[]> {
    return this.api.get<Characteristic[]>(`/admin/categories/${categoryId}/characteristics`);
  }

  createCharacteristic(categoryId: number, input: CharacteristicInput): Promise<Characteristic> {
    return this.api.post<Characteristic>(`/admin/categories/${categoryId}/characteristics`, input);
  }

  updateCharacteristic(id: number, input: CharacteristicInput): Promise<Characteristic> {
    return this.api.put<Characteristic>(`/admin/characteristics/${id}`, input);
  }

  deleteCharacteristic(id: number): Promise<void> {
    return this.api.delete<void>(`/admin/characteristics/${id}`);
  }
}
