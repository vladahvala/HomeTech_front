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

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    let response: Response;
    try {
      response = await fetch(this.baseUrl + path, {
        method,
        headers,
        credentials: 'include',
        body: body === undefined ? undefined : JSON.stringify(body),
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
