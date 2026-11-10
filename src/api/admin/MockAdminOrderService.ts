import type {
  AdminOrder,
  AdminOrderListItem,
  AdminOrderQuery,
  OrderCustomer,
  Page,
  PaymentUpdateRequest,
  StatusChangeRequest,
} from '../../types';
import { ORDER_STATUS_LABELS } from '../../utils/labels';
import { allowedTransitions } from '../../utils/orderTransitions';
import { validateInternalNote, validateStatusNote } from '../../validation/rules';
import { ApiError } from '../ApiError';
import { getMockUserById } from '../auth/MockAuthService';
import { loadOrders, saveOrders, toClientOrder } from '../mock/orderStore';
import type { StoredOrder } from '../mock/orderStore';
import type { AdminOrderService } from './AdminOrderService';
import { delay, requireAdmin } from './mockAdmin';

// ТИМЧАСОВО, поки немає бекенду. Правила — як має робити бекенд за UC-ADM-ORD-01…03.

const PAGE_SIZE = 20;

function customerOf(order: StoredOrder): OrderCustomer {
  const user = getMockUserById(order.userId);
  return user
    ? { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone }
    : { id: order.userId, fullName: order.recipient.fullName, email: '—', phone: order.recipient.phone };
}

function toAdminOrder(order: StoredOrder): AdminOrder {
  return {
    ...toClientOrder(order),
    customer: customerOf(order),
    internalNote: order.internalNote,
    allowedTransitions: allowedTransitions(order.status, order.delivery.method, 'admin'),
  };
}

function findOrder(number: string): StoredOrder {
  const order = loadOrders().find((item) => item.number === number);
  if (!order) {
    throw new ApiError(404, 'NOT_FOUND', 'Замовлення не знайдено. Перевірте номер.');
  }
  return order;
}

/** Дата оформлення за київським часом: 'YYYY-MM-DD' — для фільтра періоду */
function kyivDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date(iso));
}

export class MockAdminOrderService implements AdminOrderService {
  async listOrders(query: AdminOrderQuery): Promise<Page<AdminOrderListItem>> {
    await delay(250);
    requireAdmin();

    const customerText = query.customer?.toLocaleLowerCase('uk');
    const numberText = query.number?.toUpperCase();

    const list = loadOrders()
      .filter((order) => !query.statuses.length || query.statuses.includes(order.status))
      .filter((order) => !query.dateFrom || kyivDate(order.createdAt) >= query.dateFrom)
      .filter((order) => !query.dateTo || kyivDate(order.createdAt) <= query.dateTo)
      .filter((order) => !numberText || order.number.includes(numberText))
      .filter((order) => {
        if (!customerText) return true;
        const customer = customerOf(order);
        return [customer.fullName, customer.email, customer.phone, order.recipient.fullName]
          .join(' ')
          .toLocaleLowerCase('uk')
          .includes(customerText);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);

    const start = (query.page - 1) * PAGE_SIZE;
    return {
      items: list.slice(start, start + PAGE_SIZE).map((order) => ({
        number: order.number,
        createdAt: order.createdAt,
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        total: order.total,
        status: order.status,
        customer: customerOf(order),
        paymentStatus: order.paymentStatus ?? 'unpaid',
        delivery: order.delivery.method,
      })),
      total: list.length,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  }

  async getOrder(number: string): Promise<AdminOrder> {
    await delay(250);
    requireAdmin();
    return toAdminOrder(findOrder(number));
  }

  async changeStatus(number: string, request: StatusChangeRequest): Promise<AdminOrder> {
    await delay();
    const admin = requireAdmin();
    const order = findOrder(number);

    // крок 6: статус той самий, що бачив Адміністратор? (А2, REL-03)
    if (order.status !== request.expectedStatus) {
      throw new ApiError(
        409,
        'STATUS_CHANGED',
        `Статус уже змінено: зараз замовлення «${ORDER_STATUS_LABELS[order.status]}». Перегляньте актуальний стан.`,
      );
    }
    // перехід дозволений таблицею 3.3? (А3, FUN-02)
    if (!allowedTransitions(order.status, order.delivery.method, 'admin').includes(request.status)) {
      throw new ApiError(
        409,
        'TRANSITION_NOT_ALLOWED',
        `Перехід «${ORDER_STATUS_LABELS[order.status]}» → «${ORDER_STATUS_LABELS[request.status]}» не дозволений.`,
      );
    }
    const noteError = validateStatusNote(request.note, request.status === 'cancelled');
    if (noteError) {
      throw new ApiError(400, 'VALIDATION_ERROR', noteError, { note: noteError });
    }

    // крок 7: новий статус і запис історії разом (FUN-05)
    const updated: StoredOrder = {
      ...order,
      status: request.status,
      history: [
        ...order.history,
        {
          from: order.status,
          to: request.status,
          at: new Date().toISOString(),
          by: admin.fullName,
          note: request.note.trim() || null,
        },
      ],
    };
    saveOrders(loadOrders().map((item) => (item.id === order.id ? updated : item)));
    return toAdminOrder(updated);
  }

  async updatePayment(number: string, request: PaymentUpdateRequest): Promise<AdminOrder> {
    await delay();
    requireAdmin();
    const order = findOrder(number);

    const noteError = validateInternalNote(request.internalNote);
    if (noteError) {
      throw new ApiError(400, 'VALIDATION_ERROR', noteError, { internalNote: noteError });
    }

    const updated: StoredOrder = {
      ...order,
      paymentStatus: request.paymentStatus,
      internalNote: request.internalNote.trim() || null,
    };
    saveOrders(loadOrders().map((item) => (item.id === order.id ? updated : item)));
    return toAdminOrder(updated);
  }
}
