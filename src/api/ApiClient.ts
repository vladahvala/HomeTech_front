import { ApiError } from './ApiError';
import type { FieldErrors } from './ApiError';

interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
    fields?: FieldErrors;
  };
}

/**
 * Обгортка над fetch для REST API бекенду.
 * credentials: 'include' — щоб браузер надсилав cookie сесії (SEC-08).
 */
export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /** Завантаження файлу (multipart/form-data) — фото товару, прайс */
  upload<T>(path: string, form: FormData): Promise<T> {
    return this.request<T>('POST', path, form);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const isForm = body instanceof FormData;
    // для FormData заголовок із межею (boundary) браузер ставить сам
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(this.baseUrl + path, {
        method,
        headers,
        credentials: 'include',
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Не вдалося з’єднатися з сервером. Перевірте інтернет і спробуйте ще раз.',
      );
    }

    if (response.status === 204) return undefined as T;

    const data: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const error = (data as ErrorBody | null)?.error;
      throw new ApiError(
        response.status,
        error?.code ?? 'UNKNOWN_ERROR',
        error?.message ?? 'Сталася помилка на сервері. Спробуйте ще раз пізніше.',
        error?.fields ?? {},
      );
    }

    return data as T;
  }
}
