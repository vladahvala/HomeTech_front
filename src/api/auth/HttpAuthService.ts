import type { LoginData, PasswordChangeData, ProfileData, RegisterData, User } from '../../types';
import type { ApiClient } from '../ApiClient';
import { ApiError } from '../ApiError';
import type { AuthService } from './AuthService';

/** Вхід через справжній бекенд (опис запитів — docs/API.md) */
export class HttpAuthService implements AuthService {
  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.api.get<User>('/auth/me');
    } catch (error) {
      // 401 — просто «не увійшов», це не помилка
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }

  login(data: LoginData): Promise<User> {
    return this.api.post<User>('/auth/login', data);
  }

  register(data: RegisterData): Promise<User> {
    return this.api.post<User>('/auth/register', data);
  }

  async logout(): Promise<void> {
    await this.api.post<void>('/auth/logout');
  }

  updateProfile(data: ProfileData): Promise<User> {
    return this.api.patch<User>('/account/profile', data);
  }

  async changePassword(data: PasswordChangeData): Promise<void> {
    await this.api.post<void>('/account/password', data);
  }
}
