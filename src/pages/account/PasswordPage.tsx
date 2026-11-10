import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import type { FieldErrors } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import FormField from '../../components/FormField';
import Notice from '../../components/Notice';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HINTS, validatePassword } from '../../validation/rules';

/** Зміна пароля (UC-ACC-05) — для Клієнта й Адміністратора */
export default function PasswordPage() {
  useDocumentTitle('Зміна пароля');
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const found: FieldErrors = {};
    if (!currentPassword) found.currentPassword = 'Вкажіть поточний пароль.';
    const newError = validatePassword(newPassword);
    if (newError) found.newPassword = newError;
    else if (newPassword === currentPassword) {
      found.newPassword = 'Новий пароль збігається з поточним. Придумайте інший.';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setMessage({
        kind: 'success',
        text: 'Пароль змінено. На інших пристроях потрібно буде увійти знову.',
      });
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields);
      setMessage({ kind: 'error', text: getErrorMessage(error) });
    } finally {
      // паролі у формі не зберігаємо — ні після успіху, ні після помилки (USB-03)
      setCurrentPassword('');
      setNewPassword('');
      setIsSaving(false);
    }
  };

  return (
    <AccountLayout title="Зміна пароля">
      <form className="account-form" onSubmit={handleSubmit} noValidate>
        {message && <Notice kind={message.kind}>{message.text}</Notice>}

        <FormField
          id="password-current"
          label="Поточний пароль"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          error={errors.currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setErrors((current) => {
              const next = { ...current };
              delete next.currentPassword;
              return next;
            });
          }}
        />
        <FormField
          id="password-new"
          label="Новий пароль"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          hint={HINTS.password}
          error={errors.newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setErrors((current) => {
              const next = { ...current };
              delete next.newPassword;
              return next;
            });
          }}
        />

        <button className="cart-button account-form__submit" type="submit" disabled={isSaving}>
          {isSaving ? 'Зберігаємо…' : 'Змінити пароль'}
        </button>
      </form>
    </AccountLayout>
  );
}
