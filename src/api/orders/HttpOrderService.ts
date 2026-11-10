import type { CartCheckLine, CreateOrderRequest, Order } from '../../types';
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
}
