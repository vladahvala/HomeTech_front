import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import NotFoundPage from '../pages/NotFoundPage';
import type { UserRole } from '../types';

interface RequireAuthProps {
  /** Якщо вказано — сторінка лише для цієї ролі */
  role?: UserRole;
  children: ReactNode;
}

/**
 * Обгортка для закритих сторінок.
 * Гість потрапляє на вхід, а після входу повертається сюди.
 * Це лише зручність інтерфейсу — справжню перевірку прав робить бекенд (SEC-03).
 */
export default function RequireAuth({ role, children }: RequireAuthProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <p className="page-status">Завантаження…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (role && user.role !== role) {
    return <NotFoundPage message="Ця сторінка вам недоступна" />;
  }

  return children;
}
