import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import { adminManufacturerService } from '../../api';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import type { FieldErrors } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminManufacturer } from '../../types';
import { validateManufacturerInput } from '../../validation/rules';

/** Виробники: пошук і зміна назви чи країни (UC-ADM-MNF-01) */
export default function AdminManufacturersPage() {
  useDocumentTitle('Виробники');
  const { data, error, isLoading, reload } = useAsync(() => adminManufacturerService.listManufacturers(), []);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const text = search.trim().toLocaleLowerCase('uk');
  const found = (data ?? []).filter(
    (item) => !text || `${item.name} ${item.country ?? ''}`.toLocaleLowerCase('uk').includes(text),
  );

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data) content = <ListState kind="loading" text="Завантажуємо виробників…" />;
  else if (found.length === 0) {
    content = <ListState kind="empty" text={text ? 'Немає виробників за цим запитом.' : 'Виробників ще немає.'} />;
  } else {
    content = (
      <table className={`orders-table admin-manufacturers${isLoading ? ' orders-table--loading' : ''}`}>
        <thead>
          <tr>
            <th scope="col">Назва</th>
            <th scope="col">Країна</th>
            <th scope="col">Товарів</th>
            <th scope="col">
              <span className="visually-hidden">Дії</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {found.map((item) =>
            editingId === item.id ? (
              <ManufacturerRow
                key={item.id}
                manufacturer={item}
                onCancel={() => setEditingId(null)}
                onSaved={(saved) => {
                  setEditingId(null);
                  setMessage(`Виробника «${saved.name}» збережено.`);
                  reload();
                }}
              />
            ) : (
              <tr key={item.id}>
                <td data-label="Назва">
                  <strong>{item.name}</strong>
                </td>
                <td data-label="Країна">{item.country ?? <span className="admin-products__missing">не вказано</span>}</td>
                <td data-label="Товарів">
                  {item.productsCount > 0 ? (
                    <Link to={`/admin/products?manufacturer=${item.id}`}>{item.productsCount}</Link>
                  ) : (
                    0
                  )}
                </td>
                <td data-label="Дії" className="admin-products__actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      setEditingId(item.id);
                      setMessage('');
                    }}
                  >
                    Змінити
                  </button>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    );
  }

  return (
    <AccountLayout title="Виробники">
      <div className="admin-filters admin-manufacturers__search">
        <label className="admin-filters__field">
          <span>Пошук за назвою або країною</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <p className="admin-toolbar__text">
          Нових виробників створюють імпорт прайсу й форма товару — коли вводите нову назву.
        </p>
      </div>
      {message && <Notice kind="success">{message}</Notice>}
      {content}
    </AccountLayout>
  );
}

interface ManufacturerRowProps {
  manufacturer: AdminManufacturer;
  onCancel: () => void;
  onSaved: (manufacturer: AdminManufacturer) => void;
}

/** Рядок у режимі редагування */
function ManufacturerRow({ manufacturer, onCancel, onSaved }: ManufacturerRowProps) {
  const [name, setName] = useState(manufacturer.name);
  const [country, setCountry] = useState(manufacturer.country ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const formId = `manufacturer-${manufacturer.id}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure('');
    const input = { name, country: country.trim() || null };
    const found = validateManufacturerInput(input);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setIsSaving(true);
    try {
      onSaved(await adminManufacturerService.updateManufacturer(manufacturer.id, input));
    } catch (reason) {
      setIsSaving(false);
      // А: назва іншого виробника без урахування регістру
      if (reason instanceof ApiError && Object.keys(reason.fields).length > 0) setErrors(reason.fields);
      else setFailure(getErrorMessage(reason));
    }
  };

  return (
    <tr className="admin-manufacturers__editing">
      <td data-label="Назва">
        {/* форма в комірці: поля інших комірок прив'язані до неї атрибутом form */}
        <form id={formId} onSubmit={handleSubmit} noValidate>
          <input
            className={`form-field__input${errors.name ? ' form-field__input--invalid' : ''}`}
            aria-label="Назва виробника"
            value={name}
            autoFocus
            onChange={(event) => {
              setName(event.target.value);
              setErrors({});
            }}
          />
        </form>
        {errors.name && <p className="form-field__error">{errors.name}</p>}
      </td>
      <td data-label="Країна">
        <input
          form={formId}
          className={`form-field__input${errors.country ? ' form-field__input--invalid' : ''}`}
          aria-label="Країна виробника"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
        {errors.country && <p className="form-field__error">{errors.country}</p>}
      </td>
      <td data-label="Товарів">{manufacturer.productsCount}</td>
      <td data-label="Дії" className="admin-products__actions">
        <span className="admin-confirm">
          <button type="submit" form={formId} className="link-button" disabled={isSaving}>
            {isSaving ? 'Зберігаємо…' : 'Зберегти'}
          </button>
          <button type="button" className="link-button" onClick={onCancel}>
            Скасувати
          </button>
        </span>
        {failure && (
          <p className="form-field__error" role="alert">
            {failure}
          </p>
        )}
      </td>
    </tr>
  );
}
