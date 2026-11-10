import type { ImportReport } from '../../types';
import type { ApiClient } from '../ApiClient';
import type { AdminImportService } from './AdminImportService';

/** Імпорт через справжній бекенд (опис запитів — docs/API.md) */
export class HttpAdminImportService implements AdminImportService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async getLastReport(): Promise<ImportReport | null> {
    // 204 — імпорту ще не було
    return (await this.api.get<ImportReport | undefined>('/admin/import/last')) ?? null;
  }

  importPrice(file: File): Promise<ImportReport> {
    const form = new FormData();
    form.append('file', file);
    return this.api.upload<ImportReport>('/admin/import', form);
  }
}
