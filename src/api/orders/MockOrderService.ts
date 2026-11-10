import type {
  CartCheckLine,
  CreateOrderRequest,
  DeliveryInfo,
  Order,
  OrderListItem,
  Page,
  User,
} from '../../types';
import { kyivToday } from '../../utils/dates';
import { canClientCancel, ORDER_STATUS_LABELS, PAYMENTS_BY_DELIVERY } from '../../utils/labels';
import {
  normalizePhone,
  validateAddress,
  validateComment,
  validateDeliveryDate,
  validateFullName,
  validatePhone,
  validateCancelReason,
  validatePlace,
} from '../../validation/rules';
import { ApiError } from '../ApiError';
import type { FieldErrors } from '../ApiError';
import { getMockSessionUser } from '../auth/MockAuthService';
import { PRODUCTS } from '../mock/catalogData';
import { loadOrders, nextOrderId, orderNumber, saveOrders, toClientOrder } from '../mock/orderStore';
import type { StoredOrder } from '../mock/orderStore';
import type { MockProduct } from '../mock/catalogData';
import type { OrderService } from './OrderService';

// ТИМЧАСОВО, поки немає бекенду. Замовлення зберігаються в localStorage.
// Перевірки — ті самі, що має робити бекенд за UC-ORD-01 (кроки 11–13).

const INTERVALS = ['09-12', '12-15', '15-18', '18-21'];

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

function toSummary(product: MockProduct) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    availability: product.availability,
    imageUrl: product.imageUrl,
  };
}

/** Перевірка доставки й оплати (FUN-06, таблиці 3.4 і 3.5) */
function validateDelivery(delivery: DeliveryInfo, errors: FieldErrors) {
  if (delivery.method === 'courier') {
    const address = validateAddress(delivery.address);
    const date = validateDeliveryDate(delivery.date, kyivToday());
    if (address) errors.address = address;
    if (date) errors.date = date;
    if (!INTERVALS.includes(delivery.interval)) errors.interval = 'Оберіть інтервал доставки.';
  } else if (delivery.method === 'nova_poshta') {
    const city = validatePlace(delivery.city, 'місто');
    const branch = validatePlace(delivery.branch, 'відділення');
    if (city) errors.city = city;
    if (branch) errors.branch = branch;
  } else if (delivery.method !== 'pickup') {
    errors.delivery = 'Оберіть спосіб доставки.';
  }
}

export class MockOrderService implements OrderService {
  async checkCart(productIds: number[]): Promise<CartCheckLine[]> {
    await delay(250);
    return productIds.map((productId) => {
      const product = PRODUCTS.find((item) => item.id === productId);
      return { productId, product: product ? toSummary(product) : null };
    });
  }

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    await delay();

    const user = getMockSessionUser();
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Сесія завершилась. Увійдіть знову — кошик збережено.');
    }
    if (user.role === 'admin') {
      throw new ApiError(403, 'ADMIN_CANNOT_ORDER', 'Замовлення оформлює Клієнт. Увійдіть як клієнт.');
    }

    const orders = loadOrders();

    // А7: те саме підтвердження вдруге — повертаємо вже створене замовлення (REL-02)
    const existing = orders.find(
      (order) => order.idempotencyKey === request.idempotencyKey && order.userId === user.id,
    );
    if (existing) return toClientOrder(existing);

    if (request.items.length === 0 || request.items.length > 50) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'У кошику має бути від 1 до 50 різних товарів.');
    }
    if (request.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Кількість кожного товару — від 1 до 99.');
    }

    // А6: перевірка введених даних (FUN-09)
    const errors: FieldErrors = {};
    const fullName = validateFullName(request.recipient.fullName);
    const phone = validatePhone(request.recipient.phone);
    const comment = validateComment(request.comment);
    if (fullName) errors.fullName = fullName;
    if (phone) errors.phone = phone;
    if (comment) errors.comment = comment;
    validateDelivery(request.delivery, errors);
    if (!PAYMENTS_BY_DELIVERY[request.delivery.method]?.includes(request.payment)) {
      errors.payment = 'Цей спосіб оплати недоступний для обраної доставки. Оберіть інший.';
    }
    if (Object.keys(errors).length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', errors);
    }

    // А4, А5: товар зник, закінчився або змінив ціну
    const lines = request.items.map((item) => ({
      item,
      product: PRODUCTS.find((product) => product.id === item.productId),
    }));
    const changed = lines.some(
      ({ item, product }) =>
        !product || product.availability === 'out_of_stock' || product.price !== item.price,
    );
    if (changed) {
      throw new ApiError(
        409,
        'CART_CHANGED',
        'Поки ви оформлювали замовлення, деякі товари змінилися. Перевірте кошик.',
      );
    }

    // кроки 12–13: сума за поточними цінами, номер DT-000001, перший запис історії
    const now = new Date().toISOString();
    const id = nextOrderId(orders);
    const order: StoredOrder = {
      id,
      number: orderNumber(id),
      status: 'new',
      createdAt: now,
      items: lines.map(({ item, product }) => ({
        productId: item.productId,
        name: product!.name,
        price: product!.price,
        quantity: item.quantity,
      })),
      total: lines.reduce((sum, { item, product }) => sum + product!.price * item.quantity, 0),
      recipient: {
        fullName: request.recipient.fullName.trim(),
        phone: normalizePhone(request.recipient.phone),
      },
      delivery: request.delivery,
      payment: request.payment,
      paymentStatus: 'unpaid',
      comment: request.comment.trim() || null,
      history: [{ from: null, to: 'new', at: now, by: 'Клієнт', note: null }],
      userId: user.id,
      idempotencyKey: request.idempotencyKey,
      internalNote: null,
    };

    saveOrders([...orders, order]);

    return toClientOrder(order);
  }

  async listMyOrders(page: number): Promise<Page<OrderListItem>> {
    await delay(250);
    const user = requireClient();
    const mine = loadOrders()
      .filter((order) => order.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);

    const start = (page - 1) * PAGE_SIZE;
    return {
      items: mine.slice(start, start + PAGE_SIZE).map((order) => ({
        number: order.number,
        createdAt: order.createdAt,
        itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        total: order.total,
        status: order.status,
      })),
      total: mine.length,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  async getMyOrder(number: string): Promise<Order> {
    await delay(250);
    return toClientOrder(findMine(requireClient(), number));
  }

  async cancelMyOrder(number: string, reason: string): Promise<Order> {
    await delay();
    const user = requireClient();
    const order = findMine(user, number);

    if (!canClientCancel(order.status)) {
      throw new ApiError(
        409,
        'STATUS_CHANGED',
        `Замовлення вже в статусі «${ORDER_STATUS_LABELS[order.status]}» — скасувати його може лише магазин.`,
      );
    }
    const reasonError = validateCancelReason(reason);
    if (reasonError) {
      throw new ApiError(400, 'VALIDATION_ERROR', reasonError, { reason: reasonError });
    }

    const cancelled: StoredOrder = {
      ...order,
      status: 'cancelled',
      history: [
        ...order.history,
        { from: order.status, to: 'cancelled', at: new Date().toISOString(), by: 'Клієнт', note: reason.trim() || null },
      ],
    };
    saveOrders(loadOrders().map((item) => (item.id === order.id ? cancelled : item)));
    return toClientOrder(cancelled);
  }
}

const PAGE_SIZE = 20;

function requireClient(): User {
  const user = getMockSessionUser();
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Сесія завершилась. Увійдіть знову.');
  if (user.role !== 'client') throw new ApiError(403, 'FORBIDDEN', 'Ця сторінка доступна клієнтам.');
  return user;
}

/** Чуже замовлення — та сама відповідь, що й неіснуюче (SEC-05) */
function findMine(user: User, number: string): StoredOrder {
  const order = loadOrders().find((item) => item.number === number && item.userId === user.id);
  if (!order) {
    throw new ApiError(404, 'NOT_FOUND', 'Замовлення не знайдено. Перевірте номер або відкрийте список своїх замовлень.');
  }
  return order;
}
