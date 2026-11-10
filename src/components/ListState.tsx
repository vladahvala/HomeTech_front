import type { ReactNode } from 'react';
import { getErrorMessage } from '../api/ApiError';

type ListStateProps =
  | { kind: 'loading'; text?: string }
  | { kind: 'empty'; text: string; children?: ReactNode }
  | { kind: 'error'; error: unknown; onRetry?: () => void };

/** Стани списку: завантаження, порожньо, помилка (USB-04) */
export default function ListState(props: ListStateProps) {
  if (props.kind === 'loading') {
    return (
      <p className="list-state list-state--loading" role="status">
        {props.text ?? 'Завантаження…'}
      </p>
    );
  }

  if (props.kind === 'empty') {
    return (
      <div className="list-state list-state--empty" role="status">
        <p className="list-state__text">{props.text}</p>
        {props.children}
      </div>
    );
  }

  return (
    <div className="list-state list-state--error" role="alert">
      <p className="list-state__text">{getErrorMessage(props.error)}</p>
      {props.onRetry && (
        <button type="button" className="cart-button list-state__retry" onClick={props.onRetry}>
          Спробувати ще раз
        </button>
      )}
    </div>
  );
}
