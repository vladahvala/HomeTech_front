// ТИМЧАСОВИЙ розбір прайсу Katran у браузері — щоб імпорт можна було показати без бекенду.
// Справжній розбір робить сервер (UC-IMP-01, SUP-06). Формат — A4 SRS: CSV у Windows-1251
// (UTF-8 теж приймаємо), роздільник «;», десятковий роздільник — кома, «ціни немає» — 7,00.

import type { Availability } from '../../types';
import { ApiError } from '../ApiError';

export interface PriceRow {
  /** Номер рядка у файлі (1 — заголовок) */
  line: number;
  code: string;
  article: string | null;
  name: string;
  rrp: number | null;
  retail: number | null;
  purchase: number | null;
  availability: Availability;
  warrantyMonths: number | null;
  photo: string | null;
  manufacturer: string | null;
}

export interface ParsedPrice {
  rows: PriceRow[];
  errors: { row: number; message: string }[];
}

/** Назви колонок, які розуміє розбір (без урахування регістру) */
export const PRICE_COLUMNS = {
  code: ['код', 'код товару'],
  article: ['артикул'],
  name: ['найменування', 'назва', 'назва товару'],
  rrp: ['ррц'],
  retail: ['роздріб', 'роздрібна ціна', 'ціна роздрібна'],
  purchase: ['вхід', 'закупівельна ціна', 'ціна закупівлі', 'ціна дилера'],
  availability: ['наявність'],
  warrantyMonths: ['гарантія', 'гарантія, міс', 'гарантія, міс.'],
  photo: ['фото', 'зображення'],
  manufacturer: ['виробник', 'бренд'],
} as const;

type Column = keyof typeof PRICE_COLUMNS;

const invalidFile = (message: string) => new ApiError(400, 'INVALID_FILE', message);

/** UTF-8, якщо файл у ньому коректний, інакше Windows-1251 (основний формат Katran) */
export function decodePrice(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('windows-1251').decode(bytes);
  }
}

/** Мінімальне читання ZIP: рівно один CSV, без стиснення або deflate */
export async function unzipSingleCsv(bytes: Uint8Array): Promise<Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw invalidFile('Архів пошкоджений. Запакуйте прайс у ZIP ще раз.');

  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const csv: { method: number; size: number; local: number }[] = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw invalidFile('Архів пошкоджений.');
    const method = view.getUint16(offset + 10, true);
    const size = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const local = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (/\.csv$/i.test(name) && !name.startsWith('__MACOSX/')) csv.push({ method, size, local });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (csv.length !== 1) {
    throw invalidFile(`В архіві має бути рівно один CSV-файл, а знайдено ${csv.length}.`);
  }

  const entry = csv[0];
  const start = entry.local + 30 + view.getUint16(entry.local + 26, true) + view.getUint16(entry.local + 28, true);
  const data = bytes.subarray(start, start + entry.size);
  if (entry.method === 0) return data;
  if (entry.method !== 8) throw invalidFile('Архів стиснуто непідтримуваним способом. Використайте звичайний ZIP.');
  const stream = new Blob([data.slice()]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Рядки CSV з роздільником «;» і лапками "…" (зокрема з ; і переносами всередині) */
export function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ';') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** «1 299,00» → 1299; порожньо → null; не число → NaN */
function parseNumber(value: string | undefined): number | null {
  const text = (value ?? '').replace(/[\s ]/g, '').replace(',', '.');
  if (!text) return null;
  return /^\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}

function parseAvailability(value: string | undefined): Availability | null {
  const text = (value ?? '').trim().toLocaleLowerCase('uk');
  if (!text) return 'out_of_stock';
  const amount = Number(text.replace(',', '.'));
  if (Number.isFinite(amount)) return amount > 0 ? 'in_stock' : 'out_of_stock';
  if (/^(є|так|\+|в наявності|наявн)/.test(text)) return 'in_stock';
  if (/(очіку|замовлення|в дорозі)/.test(text)) return 'expected';
  if (/^(немає|ні|-|відсутн)/.test(text)) return 'out_of_stock';
  return null;
}

/** Ціна: РРЦ, якщо вона більша за 0 і не 7,00, інакше роздрібна за тією самою умовою */
export function choosePrice(rrp: number | null, retail: number | null): number | null {
  const valid = (price: number | null) => price !== null && Number.isFinite(price) && price > 0 && price !== 7;
  if (valid(rrp)) return rrp;
  if (valid(retail)) return retail;
  return null;
}

/** Уцінені й вживані товари імпорт пропускає */
export function isMarkdownOrUsed(name: string): boolean {
  return /(уцін|б\/в|вжива|refurb)/i.test(name);
}

export function parsePrice(text: string): ParsedPrice {
  const [header, ...lines] = splitCsv(text);
  if (!header) throw invalidFile('Файл порожній. Перевірте вивантаження прайсу.');

  const index: Partial<Record<Column, number>> = {};
  header.forEach((title, position) => {
    const normalized = title.trim().toLocaleLowerCase('uk');
    for (const [column, names] of Object.entries(PRICE_COLUMNS) as [Column, readonly string[]][]) {
      if (names.includes(normalized) && index[column] === undefined) index[column] = position;
    }
  });
  if (index.code === undefined || index.name === undefined) {
    throw invalidFile('У файлі немає колонок «Код» і «Найменування». Перевірте, що це прайс Katran з роздільником «;».');
  }

  const rows: PriceRow[] = [];
  const errors: ParsedPrice['errors'] = [];
  lines.forEach((cells, position) => {
    const line = position + 2;
    if (cells.every((cell) => !cell.trim())) return; // порожній рядок
    const get = (column: Column) => (index[column] === undefined ? undefined : cells[index[column]!]?.trim());

    const code = get('code') ?? '';
    const name = get('name') ?? '';
    const rrp = parseNumber(get('rrp'));
    const retail = parseNumber(get('retail'));
    const purchase = parseNumber(get('purchase'));
    const warranty = parseNumber(get('warrantyMonths'));
    const availability = parseAvailability(get('availability'));

    const problem = !code
      ? 'немає коду товару'
      : !name
        ? 'немає назви товару'
        : [rrp, retail, purchase].some((value) => Number.isNaN(value))
          ? 'ціна не є числом'
          : warranty !== null && (!Number.isInteger(warranty) || warranty > 120)
            ? 'гарантія має бути цілим числом місяців до 120'
            : availability === null
              ? `незрозуміла наявність «${get('availability')}»`
              : null;
    if (problem) {
      errors.push({ row: line, message: problem });
      return;
    }
    rows.push({
      line,
      code,
      article: get('article') || null,
      name,
      rrp,
      retail,
      purchase,
      availability: availability!,
      warrantyMonths: warranty,
      photo: get('photo') || null,
      manufacturer: get('manufacturer') || null,
    });
  });
  return { rows, errors };
}
