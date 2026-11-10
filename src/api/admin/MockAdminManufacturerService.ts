import type { AdminManufacturer, ManufacturerInput } from '../../types';
import { validateManufacturerInput } from '../../validation/rules';
import { ApiError } from '../ApiError';
import { loadCatalog, saveCatalog } from '../mock/catalogStore';
import type { CatalogState } from '../mock/catalogStore';
import type { AdminManufacturerService } from './AdminManufacturerService';
import { delay, notFound, requireAdmin, sameName } from './mockAdmin';

// ТИМЧАСОВО, поки немає бекенду (UC-ADM-MNF-01).

function withCount(state: CatalogState, id: number): AdminManufacturer {
  const manufacturer = state.manufacturers.find((item) => item.id === id)!;
  return {
    ...manufacturer,
    productsCount: state.products.filter((product) => !product.deleted && product.manufacturerId === id).length,
  };
}

export class MockAdminManufacturerService implements AdminManufacturerService {
  async listManufacturers(): Promise<AdminManufacturer[]> {
    await delay(200);
    requireAdmin();
    const state = loadCatalog();
    return state.manufacturers
      .map((item) => withCount(state, item.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
  }

  async updateManufacturer(id: number, input: ManufacturerInput): Promise<AdminManufacturer> {
    await delay();
    requireAdmin();
    const state = loadCatalog();
    const manufacturer = state.manufacturers.find((item) => item.id === id);
    if (!manufacturer) throw notFound('Виробника');

    const errors = validateManufacturerInput(input);
    if (Object.keys(errors).length > 0) throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', errors);

    // назва іншого виробника без урахування регістру — відхиляємо
    const duplicate = state.manufacturers.find((item) => item.id !== id && sameName(item.name, input.name));
    if (duplicate) {
      const message = `Виробник «${duplicate.name}» уже є. Назва має бути унікальною.`;
      throw new ApiError(409, 'NAME_TAKEN', message, { name: message });
    }
    manufacturer.name = input.name.trim();
    manufacturer.country = input.country?.trim() || null;
    saveCatalog(state);
    return withCount(state, id);
  }
}
