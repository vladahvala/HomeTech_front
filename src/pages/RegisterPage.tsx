import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import { ApiError, getErrorMessage } from '../api/ApiError';
import type { FieldErrors } from '../api/ApiError';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import type { RegisterData } from '../types';
import { getRedirectAfterAuth } from '../utils/redirect';
import { HINTS, normalizePhone, validateRegistration } from '../validation/rules';

const EMPTY_FORM: RegisterData = { email: '', password: '', fullName: '', phone: '' };

export default function RegisterPage() {
  const { user, register } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState<RegisterData>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={getRedirectAfterAuth(user, location.state)} replace />;
  }

  const handleChange = (field: keyof RegisterData) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    // помилка поля зникає, щойно його почали виправляти
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setEmailTaken(false);

    const errors = validateRegistration(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: normalizePhone(form.phone),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fields);
        setEmailTaken(error.code === 'EMAIL_TAKEN');
      }
      setFormError(getErrorMessage(error));
      setForm((current) => ({ ...current, password: '' }));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-page__form" onSubmit={handleSubmit} noValidate>
        <h2 className="auth-page__title">Реєстрація</h2>

        {formError && (
          <p className="auth-page__error" role="alert">
            {formError}
            {emailTaken && (
              <>
                {' '}
                <Link to="/login" state={location.state}>
                  Увійти
                </Link>
              </>
            )}
          </p>
        )}

        <FormField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          hint={HINTS.email}
          error={fieldErrors.email}
          onChange={handleChange('email')}
        />

        <FormField
          id="register-password"
          label="Пароль"
          type="password"
          autoComplete="new-password"
          value={form.password}
          hint={HINTS.password}
          error={fieldErrors.password}
          onChange={handleChange('password')}
        />

        <FormField
          id="register-name"
          label="ПІБ"
          autoComplete="name"
          value={form.fullName}
          hint={HINTS.fullName}
          error={fieldErrors.fullName}
          onChange={handleChange('fullName')}
        />

        <FormField
          id="register-phone"
          label="Телефон"
          type="tel"
          autoComplete="tel"
          value={form.phone}
          hint={HINTS.phone}
          error={fieldErrors.phone}
          onChange={handleChange('phone')}
        />

        {/* FUN-11: повідомлення про обробку персональних даних */}
        <p className="auth-page__notice">
          Натискаючи «Зареєструватися», ви погоджуєтеся на обробку ваших персональних даних
          (ПІБ, email, телефон) магазином «ДомТех» для оформлення й доставки замовлень відповідно
          до Закону України «Про захист персональних даних».
        </p>

        <button className="cart-button auth-page__submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Реєструємо…' : 'Зареєструватися'}
        </button>

        <p className="auth-page__switch">
          Уже є обліковий запис?{' '}
          <Link to="/login" state={location.state}>
            Увійти
          </Link>
        </p>
      </form>
    </main>
  );
}
