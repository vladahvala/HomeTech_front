import type {
  AdminOrder,
  AdminOrderListItem,
  AdminOrderQuery,
  Page,
  PaymentUpdateRequest,
  StatusChangeRequest,
} from '../../types';

/**
 * Замовлення магазину для Адміністратора (UC-ADM-ORD-01…03).
 * Помилки changeStatus (ApiError.code):
 * - STATUS_CHANGED (409) — статус уже змінив інший користувач (А2, REL-03);
 * - TRANSITION_NOT_ALLOWED (409) — перехід не дозволений таблицею 3.3 (А3);
 * - VALIDATION_ERROR (400) — примітка (fields.note).
 */
export interface AdminOrderService {
  /** Від нових до старих, по 20 */
  listOrders(query: AdminOrderQuery): Promise<Page<AdminOrderListItem>>;
  getOrder(number: string): Promise<AdminOrder>;
  changeStatus(number: string, request: StatusChangeRequest): Promise<AdminOrder>;
  /** Статус оплати й службова примітка (UC-ADM-ORD-03) */
  updatePayment(number: string, request: PaymentUpdateRequest): Promise<AdminOrder>;
}
