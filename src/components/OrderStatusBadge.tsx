import type { OrderStatus } from '../types';
import { ORDER_STATUS_LABELS } from '../utils/labels';

/** Статус замовлення: колір і текст (не лише колір — для доступності) */
export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`order-status order-status--${status}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
