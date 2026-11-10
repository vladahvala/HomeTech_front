import { ApiClient } from './ApiClient';
import type { AuthService } from './auth/AuthService';
import { HttpAuthService } from './auth/HttpAuthService';
import { MockAuthService } from './auth/MockAuthService';
import type { CatalogService } from './catalog/CatalogService';
import { HttpCatalogService } from './catalog/HttpCatalogService';
import { MockCatalogService } from './catalog/MockCatalogService';

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
