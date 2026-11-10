import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../api';
import type { LoginData, PasswordChangeData, ProfileData, RegisterData, User } from '../types';

interface AuthContextValue {
  /** null — гість */
  user: User | null;
  /** 'loading' — ще з'ясовуємо, чи є сесія (одразу після відкриття сайту) */
  status: 'loading' | 'ready';
  login: (data: LoginData) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  /** Сервер сказав, що сесії вже немає (401) — забуваємо користувача без запиту (А9) */
  forgetUser: () => void;
  /** UC-ACC-04: зберігає профіль і одразу оновлює дані в шапці й оформленні */
  updateProfile: (data: ProfileData) => Promise<User>;
  /** UC-ACC-05 */
  changePassword: (data: PasswordChangeData) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');

  // при відкритті сайту питаємо сервер, хто ми (сесія живе в cookie)
  useEffect(() => {
    let cancelled = false;

    authService
      .getCurrentUser()
      .then((current) => {
        if (!cancelled) setUser(current);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setStatus('ready');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (data: LoginData) => {
    const loggedIn = await authService.login(data);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const created = await authService.register(data);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const forgetUser = useCallback(() => setUser(null), []);

  const updateProfile = useCallback(async (data: ProfileData) => {
    const updated = await authService.updateProfile(data);
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback(
    (data: PasswordChangeData) => authService.changePassword(data),
    [],
  );

  const value = useMemo(
    () => ({ user, status, login, register, logout, forgetUser, updateProfile, changePassword }),
    [user, status, login, register, logout, forgetUser, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth потрібно викликати всередині <AuthProvider>');
  }
  return context;
}
