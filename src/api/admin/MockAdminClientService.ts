import type {
  AdminClient,
  AdminClientListItem,
  AdminClientQuery,
  ClientInput,
  CreatedClient,
  Page,
  TemporaryPassword,
} from '../../types';
import { normalizePhone, validateClientInput } from '../../validation/rules';
import { ApiError } from '../ApiError';
import { loadAccounts, saveAccounts } from '../mock/accountStore';
import type { MockAccount } from '../mock/accountStore';
import { loadOrders } from '../mock/orderStore';
import type { AdminClientService } from './AdminClientService';
import { delay, notFound, requireAdmin } from './mockAdmin';

// ТИМЧАСОВО, поки немає бекенду (UC-ADM-CLI-01…04).

const PAGE_SIZE = 20;
const FALLBACK_DATE = '2026-10-01T00:00:00.000Z';

/** 12 символів: літери й цифри, щонайменше одна літера й одна цифра (як вимагає пароль) */
function temporaryPassword(): string {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  const random = crypto.getRandomValues(new Uint32Array(12));
  const chars = Array.from(random, (value) => all[value % all.length]);
  chars[random[0] % 6] = letters[random[1] % letters.length];
  chars[6 + (random[2] % 6)] = digits[random[3] % digits.length];
  return chars.join('');
}

function ordersOf(userId: number) {
  return loadOrders()
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
}

function toListItem(account: MockAccount): AdminClientListItem {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    registeredAt: account.createdAt ?? FALLBACK_DATE,
    ordersCount: ordersOf(account.id).length,
    isActive: account.isActive,
  };
}

function toClient(account: MockAccount): AdminClient {
  return {
    ...toListItem(account),
    deliveryAddress: account.deliveryAddress ?? null,
    orders: ordersOf(account.id).map((order) => ({
      number: order.number,
      createdAt: order.createdAt,
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.total,
      status: order.status,
    })),
  };
}

/** Лише облікові записи з роллю «Клієнт» (SEC-07) */
function findClient(accounts: MockAccount[], id: number): MockAccount {
  const account = accounts.find((item) => item.id === id && item.role === 'client');
  if (!account) throw notFound('Клієнта');
  return account;
}

function checkInput(accounts: MockAccount[], input: ClientInput, selfId: number | null) {
  const errors = validateClientInput(input);
  if (Object.keys(errors).length > 0) throw new ApiError(400, 'VALIDATION_ERROR', 'Перевірте виділені поля.', errors);
  const email = input.email.trim().toLowerCase();
  // email унікальний серед усіх облікових записів, зокрема видалених
  if (accounts.some((item) => item.id !== selfId && item.email === email)) {
    const message = 'Цей email уже має інший обліковий запис. Вкажіть інший.';
    throw new ApiError(409, 'EMAIL_TAKEN', message, { email: message });
  }
  return {
    email,
    fullName: input.fullName.trim(),
    phone: normalizePhone(input.phone),
    deliveryAddress: input.deliveryAddress?.trim() || null,
  };
}

export class MockAdminClientService implements AdminClientService {
  async listClients(query: AdminClientQuery): Promise<Page<AdminClientListItem>> {
    await delay(250);
    requireAdmin();
    const text = query.search?.toLocaleLowerCase('uk');
    const digits = query.search?.replace(/\D/g, '');
    const list = loadAccounts()
      .filter((item) => item.role === 'client')
      .filter((item) => item.isActive === (query.status === 'active'))
      .filter((item) => {
        if (!text) return true;
        if (`${item.fullName} ${item.email}`.toLocaleLowerCase('uk').includes(text)) return true;
        // телефон шукаємо за цифрами: «067 123» знайде +380671234567
        return !!digits && digits.length >= 3 && item.phone.replace(/\D/g, '').includes(digits);
      })
      .sort((a, b) => (b.createdAt ?? FALLBACK_DATE).localeCompare(a.createdAt ?? FALLBACK_DATE) || b.id - a.id);

    const start = (query.page - 1) * PAGE_SIZE;
    return {
      items: list.slice(start, start + PAGE_SIZE).map(toListItem),
      total: list.length,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  }

  async getClient(id: number): Promise<AdminClient> {
    await delay(250);
    requireAdmin();
    return toClient(findClient(loadAccounts(), id));
  }

  async createClient(input: ClientInput): Promise<CreatedClient> {
    await delay();
    requireAdmin();
    const accounts = loadAccounts();
    const password = temporaryPassword();
    const account: MockAccount = {
      id: Math.max(0, ...accounts.map((item) => item.id)) + 1,
      ...checkInput(accounts, input, null),
      password,
      role: 'client',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    saveAccounts([...accounts, account]);
    return { client: toClient(account), temporaryPassword: password };
  }

  async updateClient(id: number, input: ClientInput): Promise<AdminClient> {
    await delay();
    requireAdmin();
    const accounts = loadAccounts();
    const account = findClient(accounts, id);
    // оформлені замовлення зберігають контакти з моменту оформлення — їх не чіпаємо
    Object.assign(account, checkInput(accounts, input, id));
    saveAccounts(accounts);
    return toClient(account);
  }

  async resetPassword(id: number): Promise<TemporaryPassword> {
    await delay();
    requireAdmin();
    const accounts = loadAccounts();
    const account = findClient(accounts, id);
    account.password = temporaryPassword();
    // справжній сервер тут завершує всі сесії Клієнта
    saveAccounts(accounts);
    return { temporaryPassword: account.password };
  }

  async deleteClient(id: number): Promise<void> {
    await delay();
    requireAdmin();
    const accounts = loadAccounts();
    findClient(accounts, id).isActive = false; // позначка замість видалення (FUN-08)
    saveAccounts(accounts);
  }

  async restoreClient(id: number): Promise<AdminClient> {
    await delay();
    requireAdmin();
    const accounts = loadAccounts();
    const account = findClient(accounts, id);
    account.isActive = true;
    saveAccounts(accounts);
    return toClient(account);
  }
}
