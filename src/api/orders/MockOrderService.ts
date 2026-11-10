import type { CartCheckLine, CreateOrderRequest, DeliveryInfo, Order } from '../../types';
import { kyivToday } from '../../utils/dates';
import { PAYMENTS_BY_DELIVERY } from '../../utils/labels';
import {
  normalizePhone,
  validateAddress,
  validateComment,
  validateDeliveryDate,
  validateFullName,
  validatePhone,
  validatePlace,
} from '../../validation/rules';
import { ApiError } from '../ApiError';
import type { FieldErrors } from '../ApiError';
import { getMockSessionUser } from '../auth/MockAuthService';
import { PRODUCTS } from '../mock/catalogData';
import type { MockProduct } from '../mock/catalogData';
import type { OrderService } from './OrderService';

// ТИМЧАСОВО, поки немає бекенду. Замовлення зберігаються в localStorage.
// Перевірки — ті самі, що має робити бекенд за UC-ORD-01 (кроки 11–13).

const ORDERS_KEY = 'hometech-mock-orders';
const INTERVALS = ['09-12', '12-15', '15-18', '18-21'];

interface StoredOrder extends Order {
  userId: number;
  idempotencyKey: string;
}

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

function loadOrders(): StoredOrder[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]') as StoredOrder[];
  } catch {
    return [];
  }
}

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
    if (existing) return existing;

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
    const id = Math.max(0, ...orders.map((order) => order.id)) + 1;
    const order: StoredOrder = {
      id,
      number: `DT-${String(id).padStart(6, '0')}`,
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
      comment: request.comment.trim() || null,
      history: [{ from: null, to: 'new', at: now, by: 'Клієнт', note: null }],
      userId: user.id,
      idempotencyKey: request.idempotencyKey,
    };

    localStorage.setItem(ORDERS_KEY, JSON.stringify([...orders, order]));

    const { userId: _userId, idempotencyKey: _key, ...publicOrder } = order;
    return publicOrder;
  }
}
