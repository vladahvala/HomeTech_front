import type { AdminCategoryService } from './admin/AdminCategoryService';
import type { AdminClientService } from './admin/AdminClientService';
import type { AdminImportService } from './admin/AdminImportService';
import type { AdminManufacturerService } from './admin/AdminManufacturerService';
import type { AdminOrderService } from './admin/AdminOrderService';
import type { AdminProductService } from './admin/AdminProductService';
import { HttpAdminCategoryService } from './admin/HttpAdminCategoryService';
import { HttpAdminClientService } from './admin/HttpAdminClientService';
import { HttpAdminImportService } from './admin/HttpAdminImportService';
import { HttpAdminManufacturerService } from './admin/HttpAdminManufacturerService';
import { HttpAdminOrderService } from './admin/HttpAdminOrderService';
import { HttpAdminProductService } from './admin/HttpAdminProductService';
import { MockAdminCategoryService } from './admin/MockAdminCategoryService';
import { MockAdminClientService } from './admin/MockAdminClientService';
import { MockAdminImportService } from './admin/MockAdminImportService';
import { MockAdminManufacturerService } from './admin/MockAdminManufacturerService';
import { MockAdminOrderService } from './admin/MockAdminOrderService';
import { MockAdminProductService } from './admin/MockAdminProductService';
import { ApiClient } from './ApiClient';
import type { AuthService } from './auth/AuthService';
import { HttpAuthService } from './auth/HttpAuthService';
import { MockAuthService } from './auth/MockAuthService';
import type { CatalogService } from './catalog/CatalogService';
import { HttpCatalogService } from './catalog/HttpCatalogService';
import { MockCatalogService } from './catalog/MockCatalogService';
import { HttpOrderService } from './orders/HttpOrderService';
import { MockOrderService } from './orders/MockOrderService';
import type { OrderService } from './orders/OrderService';

/**
 * Поки бекенду немає, працюємо на тимчасових даних (моках).
 * Щоб перейти на справжній сервер, у файлі .env.local напишіть:
 *   VITE_USE_MOCKS=false
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL ?? '/api');

export const authService: AuthService = USE_MOCKS
  ? new MockAuthService()
  : new HttpAuthService(apiClient);

export const catalogService: CatalogService = USE_MOCKS
  ? new MockCatalogService()
  : new HttpCatalogService(apiClient);

export const orderService: OrderService = USE_MOCKS
  ? new MockOrderService()
  : new HttpOrderService(apiClient);

export const adminOrderService: AdminOrderService = USE_MOCKS
  ? new MockAdminOrderService()
  : new HttpAdminOrderService(apiClient);

export const adminProductService: AdminProductService = USE_MOCKS
  ? new MockAdminProductService()
  : new HttpAdminProductService(apiClient);

export const adminCategoryService: AdminCategoryService = USE_MOCKS
  ? new MockAdminCategoryService()
  : new HttpAdminCategoryService(apiClient);

export const adminManufacturerService: AdminManufacturerService = USE_MOCKS
  ? new MockAdminManufacturerService()
  : new HttpAdminManufacturerService(apiClient);

export const adminClientService: AdminClientService = USE_MOCKS
  ? new MockAdminClientService()
  : new HttpAdminClientService(apiClient);

export const adminImportService: AdminImportService = USE_MOCKS
  ? new MockAdminImportService()
  : new HttpAdminImportService(apiClient);
