import type { OrderStatusChange } from '../types';
import { formatDateTime } from '../utils/dates';
import { ORDER_STATUS_LABELS } from '../utils/labels';

interface OrderHistoryProps {
  history: OrderStatusChange[];
  /**
   * Показувати, хто змінив статус. Адміністратор бачить виконавців (UC-ADM-ORD-01),
   * Клієнт — лише статуси, дати й примітки (FUN-05).
   */
  showPerformer?: boolean;
}

/** Історія статусів замовлення на лінії часу */
export default function OrderHistory({ history, showPerformer = false }: OrderHistoryProps) {
  return (
    <ol className="history">
      {history.map((change, index) => (
        <li key={`${change.at}-${index}`} className="history__item">
          <span className="history__date">{formatDateTime(change.at)}</span>
          <span className="history__status">
            {change.from ? `${ORDER_STATUS_LABELS[change.from]} → ` : ''}
            <strong>{ORDER_STATUS_LABELS[change.to]}</strong>
          </span>
          {showPerformer && <span className="history__by">{change.by}</span>}
          {change.note && <span className="history__note">{change.note}</span>}
        </li>
      ))}
    </ol>
  );
}
