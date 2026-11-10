import type { ReactNode } from 'react';

interface NoticeProps {
  kind: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: ReactNode;
}

/** Повідомлення в рамці: що сталося і що зробити (DOC-02) */
export default function Notice({ kind, title, children }: NoticeProps) {
  return (
    <div className={`notice notice--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {title && <p className="notice__title">{title}</p>}
      <div className="notice__body">{children}</div>
    </div>
  );
}
