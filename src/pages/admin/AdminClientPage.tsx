import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { adminClientService } from '../../api';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import type { FieldErrors } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import FormField from '../../components/FormField';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminClient, ClientInput } from '../../types';
import { formatDateTime } from '../../utils/dates';
import { formatPrice } from '../../utils/format';
import { HINTS, validateClientInput } from '../../validation/rules';
import NotFoundPage from '../NotFoundPage';

type Message = { kind: 'success' | 'error'; text: string };

/** Додати клієнта (UC-ADM-CLI-02) або переглянути й змінити його (UC-ADM-CLI-01, 03, 04) */
export default function AdminClientPage() {
  const params = useParams();
  const isNew = params.id === undefined;
  const id = Number(params.id);

  const loaded = useAsync(() => (isNew ? Promise.resolve(null) : adminClientService.getClient(id)), [params.id]);
  const [updated, setUpdated] = useState<AdminClient | null>(null);
  const client = updated && updated.id === id ? updated : loaded.data;
  const [message, setMessage] = useState<Message | null>(null);

  useDocumentTitle(isNew ? 'Новий клієнт' : (client?.fullName ?? 'Клієнт'));

  if (loaded.error instanceof ApiError && loaded.error.status === 404) {
    return <NotFoundPage message="Клієнта не знайдено" />;
  }

  const changed = (saved: AdminClient, text: string) => {
    setUpdated(saved);
    setMessage({ kind: 'success', text });
  };

  let content: ReactNode;
  if (isNew) content = <NewClient />;
  else if (loaded.error) content = <ListState kind="error" error={loaded.error} onRetry={loaded.reload} />;
  else if (!client || client.id !== id) content = <ListState kind="loading" />;
  else {
    content = (
      <div className="admin-edit">
        <div className="admin-edit__main">
          {message && <Notice kind={message.kind}>{message.text}</Notice>}
          {!client.isActive && (
            <Notice kind="warning" title="Обліковий запис видалено">
              Клієнт не може увійти. Його замовлення збережено; відновити доступ можна праворуч.
            </Notice>
          )}
          <dl className="specs order-view__facts admin-client__facts">
            <div className="specs__row">
              <dt className="specs__name">Зареєстровано</dt>
              <dd className="specs__value">{formatDateTime(client.registeredAt)}</dd>
            </div>
            <div className="specs__row">
              <dt className="specs__name">Замовлень</dt>
              <dd className="specs__value">{client.ordersCount}</dd>
            </div>
          </dl>

          <h3 className="admin-template__title">Контакти</h3>
          <ClientForm
            key={client.id}
            client={client}
            onSaved={(saved) => changed(saved, 'Дані клієнта збережено. Оформлені замовлення зберігають контакти з моменту оформлення.')}
            onError={(text) => setMessage({ kind: 'error', text })}
          />

          <h3 className="admin-template__title admin-client__orders-title">Замовлення клієнта</h3>
          {client.orders.length === 0 ? (
            <ListState kind="empty" text="Замовлень ще немає." />
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th scope="col">Номер</th>
                  <th scope="col">Дата</th>
                  <th scope="col">Товарів</th>
                  <th scope="col">Сума</th>
                  <th scope="col">Статус</th>
                </tr>
              </thead>
              <tbody>
                {client.orders.map((order) => (
                  <tr key={order.number}>
                    <td data-label="Номер">
                      <Link className="orders-table__number" to={`/admin/orders/${order.number}`}>
                        {order.number}
                      </Link>
                    </td>
                    <td data-label="Дата">{formatDateTime(order.createdAt)}</td>
                    <td data-label="Товарів">{order.itemsCount}</td>
                    <td data-label="Сума">{formatPrice(order.total)}</td>
                    <td data-label="Статус">
                      <OrderStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="admin-edit__aside">
          <PasswordPanel client={client} />
          <AccessPanel client={client} onChanged={changed} />
        </aside>
      </div>
    );
  }

  return (
    <AccountLayout
      title={isNew ? 'Новий клієнт' : (client?.fullName ?? 'Клієнт')}
      crumbs={[
        { label: 'Клієнти', to: '/admin/clients' },
        { label: isNew ? 'Новий клієнт' : (client?.fullName ?? 'Клієнт') },
      ]}
    >
      <p className="admin-edit__back">
        <Link to="/admin/clients">← До списку клієнтів</Link>
      </p>
      {content}
    </AccountLayout>
  );
}

// ----- Новий клієнт -----

/** Форма, а після створення — тимчасовий пароль, який більше ніде не покажемо */
function NewClient() {
  const [created, setCreated] = useState<{ client: AdminClient; password: string } | null>(null);
  const [message, setMessage] = useState('');
  const [formKey, setFormKey] = useState(0);

  if (created) {
    return (
      <div className="admin-client__created">
        <Notice kind="success" title={`Клієнта «${created.client.fullName}» створено`}>
          Передайте клієнту email і тимчасовий пароль. Змінити його клієнт зможе в кабінеті.
        </Notice>
        <TemporaryPasswordBox password={created.password} email={created.client.email} />
        <div className="admin-template__buttons">
          <Link className="cart-button admin-toolbar__add" to={`/admin/clients/${created.client.id}`}>
            Відкрити картку клієнта
          </Link>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setCreated(null);
              setFormKey((value) => value + 1);
            }}
          >
            Додати ще одного
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {message && <Notice kind="error">{message}</Notice>}
      <ClientForm
        key={formKey}
        client={null}
        onSaved={(client, password) => setCreated({ client, password: password ?? '' })}
        onError={setMessage}
      />
    </>
  );
}

// ----- Форма контактів -----

interface ClientFormProps {
  client: AdminClient | null;
  onSaved: (client: AdminClient, temporaryPassword?: string) => void;
  onError: (message: string) => void;
}

function ClientForm({ client, onSaved, onError }: ClientFormProps) {
  const [email, setEmail] = useState(client?.email ?? '');
  const [fullName, setFullName] = useState(client?.fullName ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [address, setAddress] = useState(client?.deliveryAddress ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const clear = (field: string) =>
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: ClientInput = { email, fullName, phone, deliveryAddress: address.trim() || null };
    const found = validateClientInput(input);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setIsSaving(true);
    try {
      if (client) {
        const saved = await adminClientService.updateClient(client.id, input);
        setIsSaving(false);
        onSaved(saved);
      } else {
        const result = await adminClientService.createClient(input);
        setIsSaving(false);
        onSaved(result.client, result.temporaryPassword);
      }
    } catch (failure) {
      setIsSaving(false);
      // А: email уже має інший обліковий запис
      if (failure instanceof ApiError && Object.keys(failure.fields).length > 0) setErrors(failure.fields);
      else onError(`${getErrorMessage(failure)} Зміни не збережено.`);
    }
  };

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="client-email"
        label="Email"
        type="email"
        autoComplete="off"
        value={email}
        error={errors.email}
        hint={HINTS.email}
        onChange={(event) => {
          setEmail(event.target.value);
          clear('email');
        }}
      />
      <FormField
        id="client-fullName"
        label="ПІБ"
        value={fullName}
        error={errors.fullName}
        hint={HINTS.fullName}
        onChange={(event) => {
          setFullName(event.target.value);
          clear('fullName');
        }}
      />
      <FormField
        id="client-phone"
        label="Телефон"
        type="tel"
        value={phone}
        error={errors.phone}
        hint={HINTS.phone}
        onChange={(event) => {
          setPhone(event.target.value);
          clear('phone');
        }}
      />
      <FormField
        id="client-address"
        label="Адреса доставки"
        value={address}
        error={errors.deliveryAddress}
        hint="Необов’язково. Підставиться в оформлення замовлення."
        onChange={(event) => {
          setAddress(event.target.value);
          clear('deliveryAddress');
        }}
      />
      <button type="submit" className="cart-button account-form__submit" disabled={isSaving}>
        {isSaving ? 'Зберігаємо…' : client ? 'Зберегти' : 'Створити клієнта'}
      </button>
    </form>
  );
}

// ----- Пароль і доступ -----

/** Тимчасовий пароль — показуємо один раз, з кнопкою «Скопіювати» */
function TemporaryPasswordBox({ password, email }: { password: string; email?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false); // буфер обміну недоступний — пароль видно, його можна виділити вручну
    }
  };

  return (
    <div className="temp-password">
      {email && (
        <p className="temp-password__row">
          Email: <strong>{email}</strong>
        </p>
      )}
      <p className="temp-password__row">
        Тимчасовий пароль: <code className="temp-password__value">{password}</code>
      </p>
      <button type="button" className="link-button" onClick={copy}>
        {copied ? 'Скопійовано' : 'Скопіювати пароль'}
      </button>
      <p className="form-field__hint">Пароль показано один раз — після виходу зі сторінки його не побачити.</p>
    </div>
  );
}

/** Скинути пароль (UC-ADM-CLI-03): новий тимчасовий пароль, усі сесії Клієнта завершуються */
function PasswordPanel({ client }: { client: AdminClient }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reset = async () => {
    setError('');
    setIsSaving(true);
    try {
      const result = await adminClientService.resetPassword(client.id);
      setPassword(result.temporaryPassword);
      setIsConfirming(false);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <h3 className="admin-panel__title">Пароль</h3>
      {password ? (
        <>
          <Notice kind="success">Пароль скинуто. Усі сесії клієнта завершено.</Notice>
          <TemporaryPasswordBox password={password} />
        </>
      ) : isConfirming ? (
        <>
          <p className="admin-panel__text">
            Поточний пароль перестане діяти, а клієнт вийде на всіх пристроях. Продовжити?
          </p>
          <button type="button" className="cart-button admin-panel__submit" disabled={isSaving} onClick={reset}>
            {isSaving ? 'Скидаємо…' : 'Так, скинути пароль'}
          </button>
          <button type="button" className="link-button admin-edit__cancel" onClick={() => setIsConfirming(false)}>
            Скасувати
          </button>
        </>
      ) : (
        <>
          <p className="admin-panel__text">Якщо клієнт забув пароль — створіть тимчасовий.</p>
          <button type="button" className="cart-button admin-panel__submit" onClick={() => setIsConfirming(true)}>
            Скинути пароль
          </button>
        </>
      )}
      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** Видалити (деактивувати) або відновити обліковий запис (UC-ADM-CLI-04) */
function AccessPanel({ client, onChanged }: { client: AdminClient; onChanged: (client: AdminClient, text: string) => void }) {
  const navigate = useNavigate();
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const run = async () => {
    setError('');
    setIsSaving(true);
    try {
      if (client.isActive) {
        await adminClientService.deleteClient(client.id);
        navigate('/admin/clients', {
          state: { flash: `Обліковий запис «${client.fullName}» видалено. Замовлення клієнта збережено.` },
        });
        return;
      }
      const restored = await adminClientService.restoreClient(client.id);
      setIsSaving(false);
      onChanged(restored, 'Обліковий запис відновлено — клієнт знову може увійти.');
    } catch (failure) {
      setIsSaving(false);
      setError(getErrorMessage(failure));
    }
  };

  return (
    <section className="admin-panel">
      <h3 className="admin-panel__title">Доступ</h3>
      <p className="admin-panel__text">
        <span className={`publish-state publish-state--${client.isActive ? 'on' : 'off'}`}>
          {client.isActive ? 'Активний' : 'Видалений'}
        </span>
      </p>
      {!client.isActive ? (
        <button type="button" className="cart-button admin-panel__submit" disabled={isSaving} onClick={run}>
          {isSaving ? 'Відновлюємо…' : 'Відновити обліковий запис'}
        </button>
      ) : isConfirming ? (
        <>
          <p className="admin-panel__text">
            Видалити обліковий запис «{client.fullName}»? Клієнт втратить доступ одразу, замовлення збережуться.
          </p>
          <button
            type="button"
            className="cart-button admin-panel__submit admin-panel__submit--danger"
            disabled={isSaving}
            onClick={run}
          >
            {isSaving ? 'Видаляємо…' : 'Так, видалити'}
          </button>
          <button type="button" className="link-button admin-edit__cancel" onClick={() => setIsConfirming(false)}>
            Скасувати
          </button>
        </>
      ) : (
        <button type="button" className="link-button link-button--danger" onClick={() => setIsConfirming(true)}>
          Видалити обліковий запис
        </button>
      )}
      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
