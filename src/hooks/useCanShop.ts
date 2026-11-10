import { useAuth } from '../context/AuthContext';

/**
 * Чи може поточний користувач користуватися кошиком.
 * Кошик — варіанти використання Гостя (UC-CRT-01…03), Клієнт отримує їх
 * через узагальнення «Клієнт → Гість». Адміністратору їх не надано (FUN-01).
 */
export function useCanShop(): boolean {
  const { user } = useAuth();
  return user?.role !== 'admin';
}
