// Правила перевірки введених даних — таблиця 3.5 SRS.
// Кожна функція повертає текст помилки (причина + що зробити, DOC-02) або null.
// Ті самі правила має перевіряти бекенд.

import type { FieldErrors } from '../api/ApiError';
import type { RegisterData } from '../types';

export const HINTS = {
  email: 'Наприклад: name@example.com',
  password: '8–72 символи, щонайменше одна літера й одна цифра',
  phone: 'Формат +380XXXXXXXXX або 0XXXXXXXXX',
  fullName: 'Прізвище, ім’я та по батькові',
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}'’ʼ\- ]+$/u;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Вкажіть email.';
  if (email.length > 254) return 'Email задовгий: максимум 254 символи.';
  if (!EMAIL_PATTERN.test(email)) return 'Email має бути у форматі name@example.com. Перевірте адресу.';
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Вкажіть пароль.';
  if (value.length < 8 || value.length > 72) return 'Пароль має містити від 8 до 72 символів.';
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) {
    return 'Додайте в пароль щонайменше одну літеру й одну цифру.';
  }
  return null;
}

export function validateFullName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'Вкажіть ПІБ.';
  if (name.length < 2 || name.length > 100) return 'ПІБ має містити від 2 до 100 символів.';
  if (!NAME_PATTERN.test(name)) return 'У ПІБ допустимі лише літери, пробіл, апостроф і дефіс.';
  return null;
}

/** 067 123 45 67 → +380671234567; якщо формат невідомий — повертає як є */
export function normalizePhone(value: string): string {
  const phone = value.replace(/[\s()-]/g, '');
  if (/^0\d{9}$/.test(phone)) return `+38${phone}`;
  return phone;
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return 'Вкажіть телефон.';
  if (!/^\+380\d{9}$/.test(normalizePhone(value))) {
    return 'Телефон має бути у форматі +380XXXXXXXXX, наприклад +380671234567.';
  }
  return null;
}

/** Перевіряє всю форму реєстрації; порожній об'єкт — помилок немає */
export function validateRegistration(data: RegisterData): FieldErrors {
  const checks: Record<keyof RegisterData, string | null> = {
    email: validateEmail(data.email),
    password: validatePassword(data.password),
    fullName: validateFullName(data.fullName),
    phone: validatePhone(data.phone),
  };

  const errors: FieldErrors = {};
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message;
  }
  return errors;
}

// ===== Оформлення замовлення (UC-ORD-01, FUN-06) =====

export const COMMENT_MAX = 1000;

export function validateAddress(value: string): string | null {
  const address = value.trim();
  if (!address) return 'Вкажіть адресу доставки.';
  if (address.length < 5 || address.length > 200) {
    return 'Адреса має містити від 5 до 200 символів: місто, вулицю, будинок, квартиру.';
  }
  return null;
}

/** Місто або відділення Нової пошти: від 3 до 200 символів */
export function validatePlace(value: string, what: 'місто' | 'відділення'): string | null {
  const place = value.trim();
  if (!place) return what === 'місто' ? 'Вкажіть місто.' : 'Вкажіть відділення.';
  if (place.length < 3 || place.length > 200) {
    return `Поле «${what}» має містити від 3 до 200 символів.`;
  }
  return null;
}

export function validateComment(value: string): string | null {
  if (value.length > COMMENT_MAX) {
    return `Коментар задовгий: максимум ${COMMENT_MAX} символів, зараз ${value.length}.`;
  }
  return null;
}

/** Дата кур'єрської доставки: від наступного дня до 14-го дня від сьогодні (FUN-06) */
export function validateDeliveryDate(value: string, today: string): string | null {
  if (!value) return 'Оберіть дату доставки.';
  const min = addDays(today, 1);
  const max = addDays(today, 14);
  if (value < min || value > max) {
    return 'Доставка кур’єром можлива з завтрашнього дня до 14 днів від сьогодні. Оберіть іншу дату.';
  }
  return null;
}

/** '2026-11-10' + 3 → '2026-11-13' (дати без часу, без зсуву часових поясів) */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
