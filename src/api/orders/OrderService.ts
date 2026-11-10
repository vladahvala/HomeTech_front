import type { CartCheckLine, CreateOrderRequest, Order, OrderListItem, Page } from '../../types';

/**
 * Кошик і замовлення.
 * Помилки createOrder (ApiError.code):
 * - UNAUTHORIZED (401) — сесія завершилась, треба увійти знову (А9);
 * - ACCOUNT_DISABLED (403) — обліковий запис деактивовано (А9);
 * - ADMIN_CANNOT_ORDER (403) — Адміністратор не оформлює замовлення (А2);
 * - VALIDATION_ERROR (400) — помилки полів у fields (А6);
 * - CART_CHANGED (409) — товар зник, закінчився або змінив ціну (А4, А5).
 */
export interface OrderService {
  /** Поточні дані товарів кошика (UC-CRT-03, крок 3 UC-ORD-01) */
  checkCart(productIds: number[]): Promise<CartCheckLine[]>;
  /** Створює замовлення; повторний виклик з тим самим ключем повертає те саме замовлення */
  createOrder(request: CreateOrderRequest): Promise<Order>;
  /** Замовлення поточного Клієнта від нових до старих, по 20 (UC-ORD-02) */
  listMyOrders(page: number): Promise<Page<OrderListItem>>;
  /** Своє замовлення; чуже — 404, як неіснуюче (UC-ORD-03, SEC-05) */
  getMyOrder(number: string): Promise<Order>;
  /**
   * Скасування Клієнтом «Нового» або «В обробці» (UC-ORD-04).
   * STATUS_CHANGED (409) — статус уже інший, скасувати може лише магазин (REL-03).
   */
  cancelMyOrder(number: string, reason: string): Promise<Order>;
}
