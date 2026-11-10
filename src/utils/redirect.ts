import type { User } from '../types';

const AUTH_PAGES = ['/login', '/register'];

/** Куди повернути користувача після входу чи реєстрації (UC-ACC-02) */
export function getRedirectAfterAuth(user: User, state: unknown): string {
  // Адміністратор одразу йде опрацьовувати замовлення
  if (user.role === 'admin') return '/admin/orders';

  // Клієнт повертається на сторінку, з якої почав вхід
  const from = (state as { from?: unknown } | null)?.from;
  if (typeof from === 'string' && from.startsWith('/') && !AUTH_PAGES.includes(from)) {
    return from;
  }
  return '/';
}
