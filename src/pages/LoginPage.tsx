import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { USE_MOCKS } from '../api';
import { getErrorMessage } from '../api/ApiError';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { HINTS } from '../validation/rules';
import { getRedirectAfterAuth } from '../utils/redirect';

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // щойно вхід виконано (або користувач уже увійшов) — переходимо далі
  if (user) {
    return <Navigate to={getRedirectAfterAuth(user, location.state)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const errors = {
      email: email.trim() ? undefined : 'Вкажіть email.',
      password: password ? undefined : 'Вкажіть пароль.',
    };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (error) {
      setFormError(getErrorMessage(error));
      setPassword(''); // введені дані зберігаємо, крім пароля (USB-03)
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
        <h2 className="auth-page__title">Вхід</h2>

        {formError && (
          <p className="auth-page__error" role="alert">
            {formError}
          </p>
        )}

        <FormField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          hint={HINTS.email}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <FormField
          id="login-password"
          label="Пароль"
          type="password"
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="cart-button auth-page__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Входимо…' : 'Увійти'}
        </button>

        <p className="auth-page__switch">
          Ще немає облікового запису?{' '}
          <Link to="/register" state={location.state}>
            Зареєструватися
          </Link>
        </p>

        {USE_MOCKS && (
          <p className="auth-page__demo">
            Тестовий режим без бекенду. Клієнт: client@domtech.ua / Client12345.
            Адміністратор: admin@domtech.ua / Admin12345.
          </p>
        )}
      </form>
    </main>
  );
}
