import type { AdminManufacturer, ManufacturerInput } from '../../types';
import type { ApiClient } from '../ApiClient';
import type { AdminManufacturerService } from './AdminManufacturerService';

/** Виробники через справжній бекенд (опис запитів — docs/API.md) */
export class HttpAdminManufacturerService implements AdminManufacturerService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  listManufacturers(): Promise<AdminManufacturer[]> {
    return this.api.get<AdminManufacturer[]>('/admin/manufacturers');
  }

  updateManufacturer(id: number, input: ManufacturerInput): Promise<AdminManufacturer> {
    return this.api.put<AdminManufacturer>(`/admin/manufacturers/${id}`, input);
  }
}
