// ТИМЧАСОВЕ сховище замовлень у localStorage — спільне для кабінету клієнта й адмінки.
// Справжній бекенд зберігає замовлення в базі даних.

import type { DeliveryInfo, Order, OrderStatus, OrderStatusChange, PaymentMethod } from '../../types';
import { PRODUCTS } from './catalogData';

const ORDERS_KEY = 'hometech-mock-orders';
const SEEDED_KEY = 'hometech-mock-demo-seeded';

export interface StoredOrder extends Order {
  userId: number;
  idempotencyKey: string;
  internalNote: string | null;
}

export function loadOrders(): StoredOrder[] {
  seedDemoOrders();
  return readOrders();
}

export function saveOrders(orders: StoredOrder[]): void {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function nextOrderId(orders: StoredOrder[]): number {
  return Math.max(0, ...orders.map((order) => order.id)) + 1;
}

/** DT-000001 (FUN-03) */
export function orderNumber(id: number): string {
  return `DT-${String(id).padStart(6, '0')}`;
}

/** Без службових полів — як віддав би сервер Клієнту */
export function toClientOrder(order: StoredOrder): Order {
  const { userId: _userId, idempotencyKey: _key, internalNote: _note, ...rest } = order;
  // замовлення, збережені до появи статусу оплати, вважаємо неоплаченими
  return { ...rest, paymentStatus: rest.paymentStatus ?? 'unpaid' };
}

function readOrders(): StoredOrder[] {
  try {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]') as StoredOrder[];
    return orders.map((order) => ({ ...order, internalNote: order.internalNote ?? null }));
  } catch {
    return [];
  }
}

// ----- Демо-замовлення для захисту: по одному в кожному статусі -----

const ADMIN_NAME = 'Адміністратор Магазину';

interface DemoOrder {
  daysAgo: number;
  items: [productId: number, quantity: number][];
  delivery: DeliveryInfo;
  payment: PaymentMethod;
  paid: boolean;
  comment: string | null;
  /** Кроки після «Нове»: [статус, хто, примітка] */
  steps: [OrderStatus, 'admin' | 'client', string | null][];
  internalNote: string | null;
}

const DEMO: DemoOrder[] = [
  {
    daysAgo: 9,
    items: [[1, 1]],
    delivery: { method: 'pickup' },
    payment: 'card_on_receipt',
    paid: true,
    comment: null,
    steps: [
      ['processing', 'admin', null],
      ['assembled', 'admin', null],
      ['delivered', 'admin', 'Видано в магазині'],
    ],
    internalNote: null,
  },
  {
    daysAgo: 6,
    items: [[20, 1], [27, 2]],
    delivery: { method: 'nova_poshta', city: 'Рівне', branch: 'Відділення № 5' },
    payment: 'invoice',
    paid: true,
    comment: 'Потрібен рахунок на ФОП',
    steps: [
      ['processing', 'admin', null],
      ['assembled', 'admin', null],
      ['shipped', 'admin', 'ТТН 20450000123456'],
    ],
    internalNote: 'Рахунок № 118 оплачено',
  },
  {
    daysAgo: 4,
    items: [[37, 1]],
    delivery: { method: 'courier', address: 'м. Рівне, вул. Соборна, 16, кв. 5', date: '', interval: '15-18' },
    payment: 'cash_on_receipt',
    paid: false,
    comment: 'Зателефонуйте за годину',
    steps: [
      ['processing', 'admin', null],
      ['assembled', 'admin', null],
    ],
    internalNote: null,
  },
  {
    daysAgo: 2,
    items: [[9, 2]],
    delivery: { method: 'nova_poshta', city: 'Київ', branch: 'Відділення № 12' },
    payment: 'cash_on_delivery',
    paid: false,
    comment: null,
    steps: [['processing', 'admin', null]],
    internalNote: 'Чекаємо підтвердження від постачальника',
  },
  {
    daysAgo: 1,
    items: [[44, 1]],
    delivery: { method: 'pickup' },
    payment: 'cash_on_receipt',
    paid: false,
    comment: null,
    steps: [['cancelled', 'client', 'Знайшов дешевше']],
    internalNote: null,
  },
  {
    daysAgo: 0,
    items: [[3, 1], [12, 1]],
    delivery: { method: 'pickup' },
    payment: 'cash_on_receipt',
    paid: false,
    comment: null,
    steps: [],
    internalNote: null,
  },
];

/** Один раз додає демо-замовлення клієнта client@domtech.ua (id 2), не чіпаючи вже створені */
function seedDemoOrders(): void {
  if (localStorage.getItem(SEEDED_KEY)) return;
  localStorage.setItem(SEEDED_KEY, '1');

  const orders = readOrders();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  for (const demo of DEMO) {
    const id = nextOrderId(orders);
    const created = now - demo.daysAgo * day - 3 * 60 * 60 * 1000;
    const items = demo.items.flatMap(([productId, quantity]) => {
      const product = PRODUCTS.find((item) => item.id === productId);
      return product ? [{ productId, name: product.name, price: product.price, quantity }] : [];
    });

    const history: OrderStatusChange[] = [
      { from: null, to: 'new', at: new Date(created).toISOString(), by: 'Клієнт', note: null },
    ];
    demo.steps.forEach(([to, who, note], index) => {
      history.push({
        from: history[history.length - 1].to,
        to,
        at: new Date(created + (index + 1) * 5 * 60 * 60 * 1000).toISOString(),
        by: who === 'admin' ? ADMIN_NAME : 'Клієнт',
        note,
      });
    });

    // дата доставки кур'єром — через день після оформлення
    const delivery: DeliveryInfo =
      demo.delivery.method === 'courier'
        ? { ...demo.delivery, date: new Date(created + day).toISOString().slice(0, 10) }
        : demo.delivery;

    orders.push({
      id,
      number: orderNumber(id),
      status: history[history.length - 1].to,
      createdAt: new Date(created).toISOString(),
      items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      recipient: { fullName: 'Олена Коваль', phone: '+380671234567' },
      delivery,
      payment: demo.payment,
      paymentStatus: demo.paid ? 'paid' : 'unpaid',
      comment: demo.comment,
      history,
      userId: 2,
      idempotencyKey: `demo-${id}`,
      internalNote: demo.internalNote,
    });
  }

  saveOrders(orders);
}
