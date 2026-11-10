import type { LoginData, PasswordChangeData, ProfileData, RegisterData, User } from '../../types';

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
  /** UC-ACC-04: ПІБ, телефон, адреса за замовчуванням → оновлений користувач */
  updateProfile(data: ProfileData): Promise<User>;
  /**
   * UC-ACC-05: перевіряє поточний пароль і зберігає новий.
   * Сесії на інших пристроях сервер завершує, поточна лишається.
   */
  changePassword(data: PasswordChangeData): Promise<void>;
}
