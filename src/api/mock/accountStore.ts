// ТИМЧАСОВЕ сховище облікових записів у localStorage — спільне для входу й адмінки.
// Паролі тут відкриті — це лише імітація, справжній бекенд зберігає хеш bcrypt (SEC-01).

import type { User } from '../../types';

export interface MockAccount extends User {
  password: string;
  isActive: boolean;
  /** Дата реєстрації (ISO); у старих записах може бракувати */
  createdAt?: string;
}

const ACCOUNTS_KEY = 'hometech-mock-accounts';
export const SESSION_KEY = 'hometech-mock-session';

/** Тестові облікові записи (адміністратора за SRS створює лише системний адміністратор) */
const SEED_ACCOUNTS: MockAccount[] = [
  {
    id: 1,
    email: 'admin@domtech.ua',
    password: 'Admin12345',
    fullName: 'Адміністратор Магазину',
    phone: '+380441234567',
    role: 'admin',
    deliveryAddress: null,
    isActive: true,
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 2,
    email: 'client@domtech.ua',
    password: 'Client12345',
    fullName: 'Олена Коваль',
    phone: '+380671234567',
    role: 'client',
    deliveryAddress: 'м. Рівне, вул. Соборна, 16, кв. 5',
    isActive: true,
    createdAt: '2026-10-20T12:30:00.000Z',
  },
  {
    id: 3,
    email: 'petro.melnyk@example.com',
    password: 'Petro12345',
    fullName: 'Петро Мельник',
    phone: '+380501112233',
    role: 'client',
    deliveryAddress: null,
    isActive: true,
    createdAt: '2026-10-28T15:10:00.000Z',
  },
  {
    id: 4,
    email: 'iryna.bondar@example.com',
    password: 'Iryna12345',
    fullName: 'Ірина Бондар',
    phone: '+380931234567',
    role: 'client',
    deliveryAddress: 'м. Київ, просп. Перемоги, 10, кв. 12',
    isActive: false, // приклад видаленого (деактивованого) Клієнта
    createdAt: '2026-10-05T08:45:00.000Z',
  },
];

export function loadAccounts(): MockAccount[] {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    if (!stored) return SEED_ACCOUNTS.map((account) => ({ ...account }));
    const accounts = JSON.parse(stored) as MockAccount[];
    // записи, створені до появи демо-клієнтів, доповнюємо ними один раз
    for (const seed of SEED_ACCOUNTS) {
      if (!accounts.some((item) => item.id === seed.id || item.email === seed.email)) {
        accounts.push({ ...seed, id: Math.max(0, ...accounts.map((item) => item.id)) + 1 });
      }
    }
    return accounts;
  } catch {
    return SEED_ACCOUNTS.map((account) => ({ ...account }));
  }
}

export function saveAccounts(accounts: MockAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}
