import type {
  AdminClient,
  AdminClientListItem,
  AdminClientQuery,
  ClientInput,
  CreatedClient,
  Page,
  TemporaryPassword,
} from '../../types';
import { toAdminClientParams } from '../../utils/adminClientQuery';
import type { ApiClient } from '../ApiClient';
import type { AdminClientService } from './AdminClientService';

/** Клієнти через справжній бекенд (опис запитів — docs/API.md) */
export class HttpAdminClientService implements AdminClientService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  listClients(query: AdminClientQuery): Promise<Page<AdminClientListItem>> {
    return this.api.get<Page<AdminClientListItem>>(`/admin/clients?${toAdminClientParams(query)}`);
  }

  getClient(id: number): Promise<AdminClient> {
    return this.api.get<AdminClient>(`/admin/clients/${id}`);
  }

  createClient(input: ClientInput): Promise<CreatedClient> {
    return this.api.post<CreatedClient>('/admin/clients', input);
  }

  updateClient(id: number, input: ClientInput): Promise<AdminClient> {
    return this.api.put<AdminClient>(`/admin/clients/${id}`, input);
  }

  resetPassword(id: number): Promise<TemporaryPassword> {
    return this.api.post<TemporaryPassword>(`/admin/clients/${id}/password-reset`);
  }

  deleteClient(id: number): Promise<void> {
    return this.api.delete<void>(`/admin/clients/${id}`);
  }

  restoreClient(id: number): Promise<AdminClient> {
    return this.api.post<AdminClient>(`/admin/clients/${id}/restore`);
  }
}
