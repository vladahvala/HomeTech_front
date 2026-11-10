import type { ImportReport } from '../../types';
import { matchesImportTemplate, validatePriceFile } from '../../validation/rules';
import { ApiError } from '../ApiError';
import { loadCatalog, nextId, saveCatalog } from '../mock/catalogStore';
import type { StoredProduct } from '../mock/catalogStore';
import { choosePrice, decodePrice, isMarkdownOrUsed, parsePrice, unzipSingleCsv } from '../mock/katranPrice';
import type { AdminImportService } from './AdminImportService';
import { delay, requireAdmin, sameName } from './mockAdmin';

// ТИМЧАСОВО, поки немає бекенду. Правила — UC-IMP-01; справжній імпорт робить сервер.

const REPORT_KEY = 'hometech-mock-last-import';
const ERROR_ROWS_LIMIT = 50;

/** Один імпорт одночасно (REL-04) */
let running = false;

export class MockAdminImportService implements AdminImportService {
  async getLastReport(): Promise<ImportReport | null> {
    await delay(150);
    requireAdmin();
    try {
      const saved = localStorage.getItem(REPORT_KEY);
      return saved ? (JSON.parse(saved) as ImportReport) : null;
    } catch {
      return null;
    }
  }

  async importPrice(file: File): Promise<ImportReport> {
    requireAdmin();
    if (running) {
      throw new ApiError(409, 'IMPORT_IN_PROGRESS', 'Імпорт уже виконується. Дочекайтеся його завершення й перегляньте звіт.');
    }
    running = true;
    try {
      return await this.run(file);
    } finally {
      running = false;
    }
  }

  private async run(file: File): Promise<ImportReport> {
    const startedAt = new Date().toISOString();
    await delay(800);
    const fileError = validatePriceFile(file);
    if (fileError) throw new ApiError(400, 'INVALID_FILE', fileError);

    let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer());
    if (/\.zip$/i.test(file.name)) bytes = await unzipSingleCsv(bytes);
    const { rows, errors } = parsePrice(decodePrice(bytes));

    // усі зміни — на копії стану й одним збереженням: при збої каталог лишається як був (REL-01)
    const state = loadCatalog();
    const now = new Date().toISOString();
    const byCode = new Map(state.products.filter((item) => item.supplierCode).map((item) => [item.supplierCode!, item]));
    const leafCategories = state.categories.filter(
      (category) => category.importTemplate && !state.categories.some((item) => item.parentId === category.id),
    );
    const seen = new Set<string>();
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      if (seen.has(row.code)) {
        errors.push({ row: row.line, message: `код ${row.code} повторюється у файлі` });
        continue;
      }
      seen.add(row.code);
      if (isMarkdownOrUsed(row.name)) {
        skipped += 1; // уцінені й вживані
        continue;
      }
      const price = choosePrice(row.rrp, row.retail);
      const existing = byCode.get(row.code);

      if (existing) {
        if (existing.deleted) {
          skipped += 1; // видалений Адміністратором товар імпорт не повертає (FUN-08)
          continue;
        }
        // оновлюємо лише поля з прайсу; решту (назву, категорію, опис…) зберігаємо
        Object.assign(existing, {
          price,
          purchasePrice: row.purchase,
          availability: row.availability,
          warrantyMonths: row.warrantyMonths,
          supplierImageUrl: row.photo,
          updatedAt: now,
        });
        updated += 1;
        continue;
      }

      const category = leafCategories.find((item) => matchesImportTemplate(item.importTemplate!, row.name));
      if (!category) {
        skipped += 1; // жодна категорія не має відповідного шаблону імпорту
        continue;
      }
      let manufacturerId: number | null = null;
      if (row.manufacturer) {
        const found = state.manufacturers.find((item) => sameName(item.name, row.manufacturer!));
        manufacturerId = found?.id ?? nextId(state.manufacturers);
        if (!found) state.manufacturers.push({ id: manufacturerId, name: row.manufacturer, country: null });
      }
      const product: StoredProduct = {
        id: nextId(state.products),
        categoryId: category.id,
        manufacturerId,
        name: row.name,
        price,
        purchasePrice: row.purchase,
        availability: row.availability,
        article: row.article,
        warrantyMonths: row.warrantyMonths,
        assemblyCountry: null,
        assemblyCity: null,
        description: '',
        createdAt: now,
        updatedAt: now,
        published: false, // новий товар — прихований, поки Адміністратор його не перевірить
        deleted: false,
        supplierCode: row.code,
        ownImageUrl: null,
        supplierImageUrl: row.photo,
        values: {},
        promoPrice: null,
        promoUntil: null,
      };
      state.products.push(product);
      added += 1;
    }

    // товари з кодом постачальника, яких немає у файлі, — «Немає»
    let outOfStock = 0;
    for (const product of state.products) {
      if (product.supplierCode && !product.deleted && !seen.has(product.supplierCode) && product.availability !== 'out_of_stock') {
        product.availability = 'out_of_stock';
        product.updatedAt = now;
        outOfStock += 1;
      }
    }

    saveCatalog(state);
    errors.sort((a, b) => a.row - b.row);
    const report: ImportReport = {
      fileName: file.name,
      startedAt,
      finishedAt: new Date().toISOString(),
      added,
      updated,
      skipped,
      errors: errors.length,
      outOfStock,
      errorRows: errors.slice(0, ERROR_ROWS_LIMIT),
    };
    localStorage.setItem(REPORT_KEY, JSON.stringify(report));
    return report;
  }
}
