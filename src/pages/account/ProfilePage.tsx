import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import type { FieldErrors } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import FormField from '../../components/FormField';
import Notice from '../../components/Notice';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { User } from '../../types';
import {
  HINTS,
  normalizePhone,
  validateFullName,
  validateOptionalAddress,
  validatePhone,
} from '../../validation/rules';

/** Редагування профілю (UC-ACC-04): ПІБ, телефон, адреса за замовчуванням */
export default function ProfilePage() {
  useDocumentTitle('Профіль');
  const { user } = useAuth();

  return (
    <AccountLayout title="Профіль">
      {/* key: якщо дані профілю змінились, форма починає з нових значень */}
      {user && <ProfileForm key={user.id} user={user} />}
    </AccountLayout>
  );
}

function ProfileForm({ user }: { user: User }) {
  const { updateProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone,
    deliveryAddress: user.deliveryAddress ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    const found: FieldErrors = {};
    const checks = {
      fullName: validateFullName(form.fullName),
      phone: validatePhone(form.phone),
      deliveryAddress: validateOptionalAddress(form.deliveryAddress),
    };
    for (const [field, error] of Object.entries(checks)) if (error) found[field] = error;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      const saved = await updateProfile({
        fullName: form.fullName.trim(),
        phone: normalizePhone(form.phone),
        deliveryAddress: form.deliveryAddress.trim() || null,
      });
      setForm({
        fullName: saved.fullName,
        phone: saved.phone,
        deliveryAddress: saved.deliveryAddress ?? '',
      });
      setMessage({ kind: 'success', text: 'Профіль збережено. Нові дані підставимо в наступне замовлення.' });
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fields);
      setMessage({ kind: 'error', text: getErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}

      <div className="form-field">
        <label className="form-field__label" htmlFor="profile-email">
          Email
        </label>
        <input
          id="profile-email"
          className="form-field__input"
          value={user.email}
          readOnly
          aria-describedby="profile-email-hint"
        />
        <p id="profile-email-hint" className="form-field__hint">
          Email змінює адміністратор магазину — зверніться до менеджера.
        </p>
      </div>

      <FormField
        id="profile-name"
        label="ПІБ"
        autoComplete="name"
        value={form.fullName}
        hint={HINTS.fullName}
        error={errors.fullName}
        onChange={(event) => update('fullName', event.target.value)}
      />
      <FormField
        id="profile-phone"
        label="Телефон"
        type="tel"
        autoComplete="tel"
        value={form.phone}
        hint={HINTS.phone}
        error={errors.phone}
        onChange={(event) => update('phone', event.target.value)}
      />
      <FormField
        id="profile-address"
        label="Адреса доставки за замовчуванням"
        autoComplete="street-address"
        value={form.deliveryAddress}
        hint="Необов’язково. Підставляється в оформлення доставки кур’єром"
        error={errors.deliveryAddress}
        onChange={(event) => update('deliveryAddress', event.target.value)}
      />

      <button className="cart-button account-form__submit" type="submit" disabled={isSaving}>
        {isSaving ? 'Зберігаємо…' : 'Зберегти'}
      </button>
    </form>
  );
}
