import type { AdminManufacturer, ManufacturerInput } from '../../types';

/**
 * Виробники (UC-ADM-MNF-01). Нових створюють імпорт і форма товару.
 * Помилки: VALIDATION_ERROR (400), NAME_TAKEN (409, fields.name) — назва іншого виробника.
 */
export interface AdminManufacturerService {
  /** Усі виробники за назвою, з кількістю товарів */
  listManufacturers(): Promise<AdminManufacturer[]>;
  updateManufacturer(id: number, input: ManufacturerInput): Promise<AdminManufacturer>;
}
