import type { ImportReport } from '../../types';

/**
 * Імпорт прайсу Katran (UC-IMP-01). Розбирає файл і оновлює каталог сервер — атомарно (REL-01).
 * Помилки (ApiError.code):
 * - INVALID_FILE (400) — не CSV/ZIP, більше 20 МБ, у ZIP не один CSV, немає потрібних колонок;
 * - IMPORT_IN_PROGRESS (409) — уже йде інший імпорт (REL-04).
 */
export interface AdminImportService {
  /** Звіт останнього імпорту або null, якщо імпорту ще не було */
  getLastReport(): Promise<ImportReport | null>;
  importPrice(file: File): Promise<ImportReport>;
}
