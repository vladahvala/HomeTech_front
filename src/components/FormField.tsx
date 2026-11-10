import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** Підказка формату під полем (DOC-01) */
  hint?: string;
  /** Помилка біля поля (USB-03) */
  error?: string;
}

/** Поле форми з підписом, підказкою й помилкою, зв'язаними для екранних читачів */
export default function FormField({ id, label, hint, error, ...inputProps }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`form-field__input${error ? ' form-field__input--invalid' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="form-field__error">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="form-field__hint">
          {hint}
        </p>
      )}
    </div>
  );
}
