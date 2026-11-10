// Спільне для моків адмінки. ТИМЧАСОВО, поки немає бекенду.

import type { User } from '../../types';
import { ApiError } from '../ApiError';
import { getMockSessionUser } from '../auth/MockAuthService';

export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/** Кожна дія адмінки перевіряє роль за «базою» (SEC-03) */
export function requireAdmin(): User {
  const user = getMockSessionUser();
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Сесія завершилась. Увійдіть знову.');
  if (user.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Дія доступна лише адміністратору.');
  return user;
}

/** Порівняння назв без урахування регістру (унікальність, таблиця 3.5) */
export function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('uk') === b.trim().toLocaleLowerCase('uk');
}

export function notFound(what: string): ApiError {
  return new ApiError(404, 'NOT_FOUND', `${what} не знайдено. Можливо, його вже видалили — оновіть список.`);
}
