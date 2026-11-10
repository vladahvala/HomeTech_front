import type { LoginData, RegisterData, User } from '../../types';

/**
 * Що фронт уміє робити з входом.
 * Є дві реалізації: HttpAuthService (справжній бекенд) і MockAuthService (поки бекенду немає).
 */
export interface AuthService {
  /** Поточний користувач за cookie сесії або null, якщо вхід не виконано */
  getCurrentUser(): Promise<User | null>;
  login(data: LoginData): Promise<User>;
  register(data: RegisterData): Promise<User>;
  logout(): Promise<void>;
}
