import type {
  AdminOrder,
  AdminOrderListItem,
  AdminOrderQuery,
  Page,
  PaymentUpdateRequest,
  StatusChangeRequest,
} from '../../types';
import { toAdminOrderParams } from '../../utils/adminOrderQuery';
import type { ApiClient } from '../ApiClient';
import type { AdminOrderService } from './AdminOrderService';

/** Замовлення магазину через справжній бекенд (опис запитів — docs/API.md) */
export class HttpAdminOrderService implements AdminOrderService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  listOrders(query: AdminOrderQuery): Promise<Page<AdminOrderListItem>> {
    return this.api.get<Page<AdminOrderListItem>>(`/admin/orders?${toAdminOrderParams(query)}`);
  }

  getOrder(number: string): Promise<AdminOrder> {
    return this.api.get<AdminOrder>(`/admin/orders/${encodeURIComponent(number)}`);
  }

  changeStatus(number: string, request: StatusChangeRequest): Promise<AdminOrder> {
    return this.api.post<AdminOrder>(`/admin/orders/${encodeURIComponent(number)}/status`, request);
  }

  updatePayment(number: string, request: PaymentUpdateRequest): Promise<AdminOrder> {
    return this.api.patch<AdminOrder>(`/admin/orders/${encodeURIComponent(number)}`, request);
  }
}
