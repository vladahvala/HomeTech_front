import type {
  AdminClient,
  AdminClientListItem,
  AdminClientQuery,
  ClientInput,
  CreatedClient,
  Page,
  TemporaryPassword,
} from '../../types';

/**
 * Клієнти магазину (UC-ADM-CLI-01…04). Дії стосуються лише облікових записів
 * з роллю «Клієнт» (SEC-07): для Адміністратора сервер відповідає 404.
 * Помилки: VALIDATION_ERROR (400, fields), EMAIL_TAKEN (409, fields.email), NOT_FOUND (404).
 */
export interface AdminClientService {
  /** Активні або видалені, за ПІБ/email/телефоном, новіші першими, по 20 */
  listClients(query: AdminClientQuery): Promise<Page<AdminClientListItem>>;
  /** Контакти, адреса, дата реєстрації й усі замовлення */
  getClient(id: number): Promise<AdminClient>;
  /** Створює обліковий запис з тимчасовим паролем із 12 символів */
  createClient(input: ClientInput): Promise<CreatedClient>;
  updateClient(id: number, input: ClientInput): Promise<AdminClient>;
  /** Новий тимчасовий пароль; усі сесії Клієнта завершуються */
  resetPassword(id: number): Promise<TemporaryPassword>;
  /** Деактивує: доступ припиняється з наступного запиту, замовлення зберігаються */
  deleteClient(id: number): Promise<void>;
  restoreClient(id: number): Promise<AdminClient>;
}
