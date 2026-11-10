import type { CartCheckLine, CreateOrderRequest, Order, OrderListItem, Page } from '../../types';
import type { ApiClient } from '../ApiClient';
import type { OrderService } from './OrderService';

/** Замовлення через справжній бекенд (опис запитів — docs/API.md) */
export class HttpOrderService implements OrderService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  checkCart(productIds: number[]): Promise<CartCheckLine[]> {
    return this.api.post<CartCheckLine[]>('/cart/check', { productIds });
  }

  createOrder(request: CreateOrderRequest): Promise<Order> {
    return this.api.post<Order>('/orders', request);
  }

  listMyOrders(page: number): Promise<Page<OrderListItem>> {
    return this.api.get<Page<OrderListItem>>(`/orders/my?page=${page}`);
  }

  getMyOrder(number: string): Promise<Order> {
    return this.api.get<Order>(`/orders/my/${encodeURIComponent(number)}`);
  }

  cancelMyOrder(number: string, reason: string): Promise<Order> {
    return this.api.post<Order>(`/orders/my/${encodeURIComponent(number)}/cancel`, { reason });
  }
}
