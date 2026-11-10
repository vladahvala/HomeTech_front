/** Помилки окремих полів форми: { email: 'Цей email уже зареєстровано…' } */
export type FieldErrors = Record<string, string>;

/**
 * Єдиний формат помилки від сервера (DSN-04):
 * { "error": { "code": "EMAIL_TAKEN", "message": "…", "fields": { "email": "…" } } }
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: FieldErrors;

  constructor(status: number, code: string, message: string, fields: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Повідомлення для будь-якої помилки — і від сервера, і непередбаченої */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Щось пішло не так. Оновіть сторінку й спробуйте ще раз.';
}
