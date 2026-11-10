// Правила перевірки введених даних — таблиця 3.5 SRS.
// Кожна функція повертає текст помилки (причина + що зробити, DOC-02) або null.
// Ті самі правила має перевіряти бекенд.

import type { FieldErrors } from '../api/ApiError';
import type {
  CategoryInput,
  Characteristic,
  CharacteristicInput,
  ClientInput,
  ManufacturerInput,
  ProductInput,
  RegisterData,
} from '../types';

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

// ===== Кабінет (UC-ACC-04, UC-ORD-04) =====

export const CANCEL_REASON_MAX = 500;

/** Адреса за замовчуванням необов'язкова, але якщо вказана — 5–200 символів */
export function validateOptionalAddress(value: string): string | null {
  return value.trim() ? validateAddress(value) : null;
}

/** Причина скасування — це примітка до статусу: до 500 символів (таблиця 3.5) */
export function validateCancelReason(value: string): string | null {
  if (value.trim().length > CANCEL_REASON_MAX) {
    return `Причина задовга: максимум ${CANCEL_REASON_MAX} символів.`;
  }
  return null;
}

// ===== Адмінка: замовлення (UC-ADM-ORD-02, 03) =====

export const STATUS_NOTE_MAX = 500;
export const INTERNAL_NOTE_MAX = 1000;

/** Примітка до статусу: до 500 символів; для скасування — причина від 3 символів (А1) */
export function validateStatusNote(value: string, isCancel: boolean): string | null {
  const note = value.trim();
  if (isCancel && note.length < 3) return 'Для скасування вкажіть причину — щонайменше 3 символи.';
  if (note.length > STATUS_NOTE_MAX) return `Примітка задовга: максимум ${STATUS_NOTE_MAX} символів.`;
  return null;
}

export function validateInternalNote(value: string): string | null {
  if (value.trim().length > INTERNAL_NOTE_MAX) {
    return `Службова примітка задовга: максимум ${INTERNAL_NOTE_MAX} символів.`;
  }
  return null;
}

// ===== Адмінка: каталог (UC-ADM-PRD-02, 03, UC-ADM-CTG-01, 02, UC-ADM-MNF-01) =====

export const PRODUCT_NAME_MIN = 3;
export const PRODUCT_NAME_MAX = 200;
export const DESCRIPTION_MAX = 5000;
export const PRICE_MIN = 0.01;
export const PRICE_MAX = 9_999_999.99;
export const WARRANTY_MAX = 120;
export const SHORT_TEXT_MAX = 60;
export const TEXT_VALUE_MAX = 200;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ENUM_OPTIONS_MIN = 2;
export const ENUM_OPTIONS_MAX = 30;
export const ORDER_MAX = 9999;

/** «1 299,50» → 1299.5; порожньо → null; не число → NaN (помилку покаже перевірка) */
export function parseDecimal(value: string): number | null {
  const text = value.replace(/[\s\u00a0]/g, '').replace(',', '.');
  if (!text) return null;
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}

/** Ціна: від 0,01 до 9 999 999,99 грн, не більше двох знаків після коми */
export function validatePrice(value: number | null): string | null {
  if (value === null) return null;
  if (!Number.isFinite(value)) return 'Ціна — це число, наприклад 1299 або 1299,50.';
  if (value < PRICE_MIN || value > PRICE_MAX) return 'Ціна має бути від 0,01 до 9 999 999,99 грн.';
  if (Math.round(value * 100) !== value * 100) return 'У ціні не більше двох знаків після коми (копійки).';
  return null;
}

/** Гарантія: ціле число місяців від 0 до 120 */
export function validateWarranty(value: number | null): string | null {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 0 || value > WARRANTY_MAX) {
    return `Гарантія — ціле число місяців від 0 до ${WARRANTY_MAX}.`;
  }
  return null;
}

function lengthError(value: string, label: string, max: number): string | null {
  return value.trim().length > max ? `${label}: максимум ${max} символів.` : null;
}

/** Значення характеристики за її типом; ключ помилки — value-<id> */
export function validateCharacteristicValue(
  characteristic: Pick<Characteristic, 'type' | 'options'>,
  value: unknown,
): string | null {
  switch (characteristic.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? null : 'Вкажіть число, наприклад 1,7.';
    case 'boolean':
      return typeof value === 'boolean' ? null : 'Оберіть «Так» або «Ні».';
    case 'enum':
      return typeof value === 'string' && characteristic.options.includes(value)
        ? null
        : 'Оберіть варіант зі списку.';
    default:
      if (typeof value !== 'string' || !value.trim()) return 'Вкажіть значення.';
      return lengthError(value, 'Значення задовге', TEXT_VALUE_MAX);
  }
}

/**
 * Форма товару. characteristics — шаблон обраної категорії: значення інших
 * характеристик сервер відкидає (зміна категорії, UC-ADM-PRD-03).
 */
export function validateProductInput(
  input: ProductInput,
  characteristics: Pick<Characteristic, 'id' | 'type' | 'options'>[],
  /** Сьогодні за Києвом — щоб не прийняти акцію, що вже закінчилась */
  today?: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Вкажіть назву товару.';
  else if (name.length < PRODUCT_NAME_MIN || name.length > PRODUCT_NAME_MAX) {
    errors.name = `Назва має містити від ${PRODUCT_NAME_MIN} до ${PRODUCT_NAME_MAX} символів.`;
  }
  if (!['in_stock', 'expected', 'out_of_stock'].includes(input.availability)) {
    errors.availability = 'Оберіть статус наявності.';
  }
  const checks: [string, string | null][] = [
    ['price', validatePrice(input.price)],
    ['warrantyMonths', validateWarranty(input.warrantyMonths)],
    ['description', lengthError(input.description, 'Опис задовгий', DESCRIPTION_MAX)],
    ['manufacturerName', lengthError(input.manufacturerName, 'Назва виробника задовга', 100)],
    ['article', lengthError(input.article, 'Артикул задовгий', SHORT_TEXT_MAX)],
    ['assemblyCountry', lengthError(input.assemblyCountry, 'Країна задовга', SHORT_TEXT_MAX)],
    ['assemblyCity', lengthError(input.assemblyCity, 'Місто задовге', SHORT_TEXT_MAX)],
  ];
  for (const [field, message] of checks) if (message) errors[field] = message;

  Object.assign(errors, validatePromo(input, today));

  for (const characteristic of characteristics) {
    const value = input.values[characteristic.id];
    if (value === undefined) continue; // характеристики необов'язкові
    const message = validateCharacteristicValue(characteristic, value);
    if (message) errors[`value-${characteristic.id}`] = message;
  }
  return errors;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Акція: ціна менша за звичайну, дата закінчення — сьогодні або пізніше */
export function validatePromo(
  input: Pick<ProductInput, 'price' | 'promoPrice' | 'promoUntil'>,
  today?: string,
): FieldErrors {
  const errors: FieldErrors = {};
  const { price, promoPrice, promoUntil } = input;
  if (promoPrice === null) {
    if (promoUntil) errors.promoPrice = 'Вкажіть акційну ціну або приберіть дату закінчення акції.';
    return errors;
  }
  const priceError = validatePrice(promoPrice);
  if (priceError) errors.promoPrice = priceError.replace('Ціна', 'Акційна ціна').replace('У ціні', 'В акційній ціні');
  else if (price === null || !Number.isFinite(price)) errors.promoPrice = 'Спершу вкажіть звичайну ціну — акційна має бути меншою за неї.';
  else if (promoPrice >= price) errors.promoPrice = 'Акційна ціна має бути меншою за звичайну.';
  if (promoUntil) {
    if (!DATE_PATTERN.test(promoUntil)) errors.promoUntil = 'Оберіть дату закінчення акції.';
    else if (today && promoUntil < today) errors.promoUntil = 'Ця дата вже минула. Оберіть сьогоднішню або пізнішу.';
  }
  return errors;
}

/** Фото товару: JPEG, PNG або WebP до 5 МБ */
export function validatePhoto(file: { type: string; size: number }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'Фото має бути у форматі JPEG, PNG або WebP.';
  if (file.size > PHOTO_MAX_BYTES) return 'Фото завелике: максимум 5 МБ. Зменште його й спробуйте ще раз.';
  return null;
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function validateOrder(value: number): string | null {
  return Number.isInteger(value) && value >= 0 && value <= ORDER_MAX
    ? null
    : `Порядок — ціле число від 0 до ${ORDER_MAX}.`;
}

/** Категорія: назва 2–60 символів, ідентифікатор в адресі — латиниця, цифри, дефіс */
export function validateCategoryInput(input: CategoryInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Вкажіть назву категорії.';
  else if (name.length < 2 || name.length > SHORT_TEXT_MAX) {
    errors.name = `Назва категорії має містити від 2 до ${SHORT_TEXT_MAX} символів.`;
  }
  const slug = input.slug.trim();
  if (!slug) errors.slug = 'Вкажіть ідентифікатор для адреси сторінки.';
  else if (slug.length < 2 || slug.length > SHORT_TEXT_MAX || !SLUG_PATTERN.test(slug)) {
    errors.slug = 'Лише малі латинські літери, цифри й дефіс між ними, 2–60 символів. Наприклад: kettles.';
  }
  const order = validateOrder(input.order);
  if (order) errors.order = order;
  const template = validateImportTemplate(input.importTemplate ?? '');
  if (template) errors.importTemplate = template;
  return errors;
}

/** Характеристика шаблону: назва, тип, для переліку — 2–30 різних варіантів */
export function validateCharacteristicInput(input: CharacteristicInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Вкажіть назву характеристики.';
  else if (name.length > SHORT_TEXT_MAX) errors.name = `Назва: максимум ${SHORT_TEXT_MAX} символів.`;
  if (!['number', 'enum', 'boolean', 'text'].includes(input.type)) errors.type = 'Оберіть тип.';
  if (input.type === 'enum') {
    const options = input.options.map((option) => option.trim()).filter(Boolean);
    const unique = new Set(options.map((option) => option.toLocaleLowerCase('uk')));
    if (options.length < ENUM_OPTIONS_MIN || options.length > ENUM_OPTIONS_MAX) {
      errors.options = `Перелік має містити від ${ENUM_OPTIONS_MIN} до ${ENUM_OPTIONS_MAX} варіантів — кожен з нового рядка.`;
    } else if (unique.size !== options.length) {
      errors.options = 'Варіанти повторюються. Залиште кожен один раз.';
    } else if (options.some((option) => option.length > SHORT_TEXT_MAX)) {
      errors.options = `Кожен варіант — до ${SHORT_TEXT_MAX} символів.`;
    }
  }
  const unit = lengthError(input.unit ?? '', 'Одиниця виміру задовга', 20);
  if (unit) errors.unit = unit;
  const order = validateOrder(input.order);
  if (order) errors.order = order;
  return errors;
}

/** Виробник: назва 1–100 символів (унікальність перевіряє сервер) */
export function validateManufacturerInput(input: ManufacturerInput): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.name.trim();
  if (!name) errors.name = 'Вкажіть назву виробника.';
  else if (name.length > 100) errors.name = 'Назва виробника: максимум 100 символів.';
  const country = lengthError(input.country ?? '', 'Країна задовга', SHORT_TEXT_MAX);
  if (country) errors.country = country;
  return errors;
}

/** Шаблон імпорту — регулярний вираз для початку назви товару в прайсі (до 200 символів) */
export function validateImportTemplate(value: string): string | null {
  const template = value.trim();
  if (!template) return null;
  if (template.length > TEXT_VALUE_MAX) return `Шаблон задовгий: максимум ${TEXT_VALUE_MAX} символів.`;
  try {
    new RegExp(template, 'iu');
  } catch {
    return 'Це не правильний регулярний вираз. Перевірте дужки, наприклад: (Електро)?чайник.';
  }
  return null;
}

/** Чи відповідає назва з прайсу шаблону: збіг з початку назви, без урахування регістру */
export function matchesImportTemplate(template: string, name: string): boolean {
  try {
    return new RegExp(`^(?:${template.trim()})`, 'iu').test(name.trim());
  } catch {
    return false;
  }
}

// ===== Адмінка: клієнти (UC-ADM-CLI-02, 03) =====

export function validateClientInput(input: ClientInput): FieldErrors {
  const checks: [string, string | null][] = [
    ['email', validateEmail(input.email)],
    ['fullName', validateFullName(input.fullName)],
    ['phone', validatePhone(input.phone)],
    ['deliveryAddress', validateOptionalAddress(input.deliveryAddress ?? '')],
  ];
  const errors: FieldErrors = {};
  for (const [field, message] of checks) if (message) errors[field] = message;
  return errors;
}

// ===== Імпорт прайсу (UC-IMP-01) =====

export const PRICE_FILE_MAX_BYTES = 20 * 1024 * 1024;

/** Файл прайсу: CSV або ZIP з одним CSV, до 20 МБ (таблиця 3.5) */
export function validatePriceFile(file: { name: string; size: number }): string | null {
  if (!/\.(csv|zip)$/i.test(file.name)) return 'Оберіть файл прайсу у форматі CSV або ZIP-архів з одним CSV.';
  if (file.size > PRICE_FILE_MAX_BYTES) return 'Файл завеликий: максимум 20 МБ.';
  if (file.size === 0) return 'Файл порожній. Перевірте вивантаження прайсу.';
  return null;
}
