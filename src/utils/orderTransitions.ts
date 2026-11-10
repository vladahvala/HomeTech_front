import type { DeliveryMethod, OrderStatus } from '../types';

// Дозволені переходи статусів замовлення — таблиця 3.3 SRS (FUN-02).
// Бекенд перевіряє те саме; тут — щоб показати адміністратору лише можливі кнопки.

export type StatusActor = 'admin' | 'client';

interface Transition {
  from: OrderStatus;
  to: OrderStatus;
  actors: StatusActor[];
  /** Додаткова умова за способом доставки */
  delivery?: DeliveryMethod[];
}

export const TRANSITIONS: Transition[] = [
  { from: 'new', to: 'processing', actors: ['admin'] },
  { from: 'new', to: 'cancelled', actors: ['client', 'admin'] },
  { from: 'processing', to: 'assembled', actors: ['admin'] },
  { from: 'processing', to: 'cancelled', actors: ['client', 'admin'] },
  { from: 'assembled', to: 'shipped', actors: ['admin'], delivery: ['courier', 'nova_poshta'] },
  { from: 'assembled', to: 'delivered', actors: ['admin'], delivery: ['pickup'] },
  { from: 'shipped', to: 'delivered', actors: ['admin'] },
];

/** Куди можна перевести замовлення; для «Поставлене» й «Скасоване» — порожньо (кінцеві) */
export function allowedTransitions(
  status: OrderStatus,
  delivery: DeliveryMethod,
  actor: StatusActor,
): OrderStatus[] {
  return TRANSITIONS.filter(
    (item) =>
      item.from === status &&
      item.actors.includes(actor) &&
      (!item.delivery || item.delivery.includes(delivery)),
  ).map((item) => item.to);
}

export function isFinalStatus(status: OrderStatus): boolean {
  return status === 'delivered' || status === 'cancelled';
}
