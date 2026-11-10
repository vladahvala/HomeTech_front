import type { LoginData, PasswordChangeData, ProfileData, RegisterData, User } from '../../types';
import {
  normalizePhone,
  validateFullName,
  validateOptionalAddress,
  validatePassword,
  validatePhone,
  validateRegistration,
} from '../../validation/rules';
import type { FieldErrors } from '../ApiError';
import { ApiError } from '../ApiError';
import { loadAccounts as loadStoredAccounts, saveAccounts as saveStoredAccounts, SESSION_KEY } from '../mock/accountStore';
import type { MockAccount } from '../mock/accountStore';
import type { AuthService } from './AuthService';

// ТИМЧАСОВО, поки немає бекенду. Облікові записи й «сесія» живуть у localStorage.
// Паролі тут зберігаються відкрито — це лише імітація, справжній бекенд хешує їх (SEC-01).

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

/** Обліковий запис за id — для моків адмінки (контакти клієнта в замовленні) */
export function getMockUserById(id: number): User | null {
  try {
    const account = loadStoredAccounts().find((item) => item.id === id);
    if (!account) return null;
    const { password: _password, isActive: _isActive, createdAt: _createdAt, ...user } = account;
    return { ...user, deliveryAddress: user.deliveryAddress ?? null };
  } catch {
    return null;
  }
}

/** Хто «увійшов» у тимчасовому режимі — для інших моків (замовлення тощо) */
export function getMockSessionUser(): User | null {
  try {
    const id = Number(localStorage.getItem(SESSION_KEY));
    // деактивований обліковий запис втрачає доступ з наступного запиту (SEC-03)
    const account = loadStoredAccounts().find((item) => item.id === id && item.isActive);
    if (!account) return null;
    const { password: _password, isActive: _isActive, createdAt: _createdAt, ...user } = account;
    return { ...user, deliveryAddress: user.deliveryAddress ?? null };
  } catch {
    return null;
  }
}

export class MockAuthService implements AuthService {
  async getCurrentUser(): Promise<User | null> {
    await delay(150);
    const id = Number(localStorage.getItem(SESSION_KEY));
    const account = this.loadAccounts().find((item) => item.id === id && item.isActive);
    return account ? this.toUser(account) : null;
  }

  async login({ email, password }: LoginData): Promise<User> {
    await delay();
    const account = this.findByEmail(email);

    // однакове повідомлення для неіснуючого email і неправильного пароля (UC-ACC-02)
    if (!account || account.password !== password) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Неправильний email або пароль');
    }
    if (!account.isActive) {
      throw new ApiError(
        403,
        'ACCOUNT_DISABLED',
        'Обліковий запис деактивовано. Зверніться до магазину, щоб його відновити.',
      );
    }

    localStorage.setItem(SESSION_KEY, String(account.id));
    return this.toUser(account);
  }

  async register(data: RegisterData): Promise<User> {
    await delay();

    // бекенд теж перевіряє дані — імітуємо його відповідь з помилками полів
    const fieldErrors = validateRegistration(data);
    if (Object.keys(fieldErrors).length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', fieldErrors);
    }

    if (this.findByEmail(data.email)) {
      const message = 'Цей email уже зареєстровано. Увійдіть або вкажіть інший email.';
      throw new ApiError(409, 'EMAIL_TAKEN', message, { email: message });
    }

    const accounts = this.loadAccounts();
    const account: MockAccount = {
      id: Math.max(0, ...accounts.map((item) => item.id)) + 1,
      email: data.email.trim().toLowerCase(),
      password: data.password,
      fullName: data.fullName.trim(),
      phone: normalizePhone(data.phone),
      role: 'client', // реєстрація завжди створює Клієнта (SEC-02)
      deliveryAddress: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.saveAccounts([...accounts, account]);
    localStorage.setItem(SESSION_KEY, String(account.id));
    return this.toUser(account);
  }

  async logout(): Promise<void> {
    await delay(150);
    localStorage.removeItem(SESSION_KEY);
  }

  async updateProfile(data: ProfileData): Promise<User> {
    await delay();
    const account = this.requireSession();

    const errors: FieldErrors = {};
    const fullName = validateFullName(data.fullName);
    const phone = validatePhone(data.phone);
    const address = validateOptionalAddress(data.deliveryAddress ?? '');
    if (fullName) errors.fullName = fullName;
    if (phone) errors.phone = phone;
    if (address) errors.deliveryAddress = address;
    if (Object.keys(errors).length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', errors);
    }

    const updated: MockAccount = {
      ...account,
      fullName: data.fullName.trim(),
      phone: normalizePhone(data.phone),
      deliveryAddress: data.deliveryAddress?.trim() || null,
    };
    this.saveAccounts(this.loadAccounts().map((item) => (item.id === updated.id ? updated : item)));
    return this.toUser(updated);
  }

  async changePassword({ currentPassword, newPassword }: PasswordChangeData): Promise<void> {
    await delay();
    const account = this.requireSession();

    if (account.password !== currentPassword) {
      const message = 'Поточний пароль неправильний. Перевірте розкладку й Caps Lock.';
      throw new ApiError(400, 'WRONG_PASSWORD', message, { currentPassword: message });
    }
    const error = validatePassword(newPassword);
    if (error) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', { newPassword: error });
    }

    // справжній сервер тут ще завершує сесії на інших пристроях
    this.saveAccounts(
      this.loadAccounts().map((item) => (item.id === account.id ? { ...item, password: newPassword } : item)),
    );
  }

  /** Обліковий запис поточної сесії або 401, як відповів би сервер */
  private requireSession(): MockAccount {
    const id = Number(localStorage.getItem(SESSION_KEY));
    const account = this.loadAccounts().find((item) => item.id === id && item.isActive);
    if (!account) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Сесія завершилась. Увійдіть знову.');
    }
    return account;
  }

  private findByEmail(email: string): MockAccount | undefined {
    const normalized = email.trim().toLowerCase();
    return this.loadAccounts().find((item) => item.email === normalized);
  }

  private loadAccounts(): MockAccount[] {
    return loadStoredAccounts();
  }

  private saveAccounts(accounts: MockAccount[]): void {
    saveStoredAccounts(accounts);
  }

  /** Пароль і службові поля назовні не віддаємо — як і справжній сервер */
  private toUser({ password, isActive, createdAt, ...user }: MockAccount): User {
    // облікові записи, збережені до появи адреси, отримують null
    return { ...user, deliveryAddress: user.deliveryAddress ?? null };
  }
}
