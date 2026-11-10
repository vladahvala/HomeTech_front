import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { adminCategoryService } from '../../api';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import type { FieldErrors } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import FormField from '../../components/FormField';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import { useAsync } from '../../hooks/useAsync';
import { invalidateCategories } from '../../hooks/useCategories';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminCategory, CategoryInput, Characteristic, CharacteristicInput, CharacteristicType } from '../../types';
import { CHARACTERISTIC_TYPE_LABELS } from '../../utils/labels';
import { slugify } from '../../utils/slug';
import { validateCategoryInput, validateCharacteristicInput } from '../../validation/rules';
import NotFoundPage from '../NotFoundPage';

type Message = { kind: 'success' | 'error'; text: string };

/** Перевірка ще й на сервері: помилки полів — у форму, решта — повідомленням */
function fieldErrorsOf(failure: unknown): FieldErrors | null {
  return failure instanceof ApiError && Object.keys(failure.fields).length > 0 ? failure.fields : null;
}

function withoutField(errors: FieldErrors, field: string): FieldErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

/** Додати чи змінити категорію (UC-ADM-CTG-01) і її шаблон характеристик (UC-ADM-CTG-02) */
export default function AdminCategoryPage() {
  const params = useParams();
  const isNew = params.id === undefined;
  const id = Number(params.id);
  const location = useLocation();
  const navigate = useNavigate();

  const { data, error, isLoading, reload } = useAsync(() => adminCategoryService.listCategories(), [params.id]);
  const category = data?.find((item) => item.id === id);
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [message, setMessage] = useState<Message | null>(null);
  const shown = message ?? (flash ? { kind: 'success' as const, text: flash } : null);

  useDocumentTitle(isNew ? 'Нова категорія' : (category?.name ?? 'Категорія'));

  // після створення список ще старий, поки не прийде новий — тому чекаємо isLoading
  if (!isNew && data && !category && !isLoading) return <NotFoundPage message="Категорію не знайдено — можливо, її видалили" />;

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data || (!isNew && !category)) content = <ListState kind="loading" />;
  else {
    content = (
      <>
        {shown && <Notice kind={shown.kind}>{shown.text}</Notice>}
        <CategoryForm
          key={category ? `${category.id}` : 'new'}
          category={category ?? null}
          categories={data}
          onSaved={(saved) => {
            invalidateCategories(); // меню каталогу перечитає категорії
            if (isNew) {
              navigate(`/admin/categories/${saved.id}`, {
                state: { flash: 'Категорію створено. Тепер можна задати її шаблон характеристик.' },
              });
              return;
            }
            setMessage({ kind: 'success', text: 'Категорію збережено.' });
            reload();
          }}
          onError={(text) => setMessage({ kind: 'error', text })}
        />

        {category &&
          (category.childrenCount > 0 ? (
            <section className="admin-template">
              <h3 className="admin-template__title">Шаблон характеристик</h3>
              <p className="admin-panel__text">
                Шаблон задають підкатегоріям — саме їм призначають товари.
              </p>
            </section>
          ) : (
            <CharacteristicsSection category={category} />
          ))}
      </>
    );
  }

  return (
    <AccountLayout
      title={isNew ? 'Нова категорія' : 'Категорія'}
      crumbs={[
        { label: 'Категорії', to: '/admin/categories' },
        { label: isNew ? 'Нова категорія' : (category?.name ?? 'Категорія') },
      ]}
    >
      <p className="admin-edit__back">
        <Link to="/admin/categories">← До списку категорій</Link>
      </p>
      {content}
    </AccountLayout>
  );
}

// ----- Категорія -----

interface CategoryFormProps {
  category: AdminCategory | null;
  categories: AdminCategory[];
  onSaved: (category: AdminCategory) => void;
  onError: (message: string) => void;
}

function CategoryForm({ category, categories, onSaved, onError }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  // поки ідентифікатор не правили вручну, він повторює назву латиницею
  const [slugTouched, setSlugTouched] = useState(category !== null);
  const [parentId, setParentId] = useState(category?.parentId ? String(category.parentId) : '');
  const [order, setOrder] = useState(String(category?.order ?? nextOrder(categories, null)));
  const [hidden, setHidden] = useState(category?.hidden ?? false);
  const [importTemplate, setImportTemplate] = useState(category?.importTemplate ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // батьківська — лише категорія верхнього рівня (два рівні)
  const parents = categories
    .filter((item) => item.parentId === null && item.id !== category?.id)
    .sort((a, b) => a.order - b.order);
  const hasChildren = (category?.childrenCount ?? 0) > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input: CategoryInput = {
      name,
      slug: slug.trim(),
      parentId: parentId ? Number(parentId) : null,
      order: order.trim() === '' ? Number.NaN : Number(order),
      hidden,
      importTemplate: importTemplate.trim() || null,
    };
    const found = validateCategoryInput(input);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setIsSaving(true);
    try {
      const saved = category
        ? await adminCategoryService.updateCategory(category.id, input)
        : await adminCategoryService.createCategory(input);
      setIsSaving(false);
      onSaved(saved);
    } catch (failure) {
      setIsSaving(false);
      const fields = fieldErrorsOf(failure);
      if (fields) setErrors(fields);
      else onError(`${getErrorMessage(failure)} Зміни не збережено.`);
    }
  };

  return (
    <form className="account-form admin-category-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="category-name"
        label="Назва"
        value={name}
        error={errors.name}
        hint="Від 2 до 60 символів, унікальна"
        onChange={(event) => {
          setName(event.target.value);
          if (!slugTouched) setSlug(slugify(event.target.value));
          setErrors((current) => withoutField(withoutField(current, 'name'), 'slug'));
        }}
      />
      <FormField
        id="category-slug"
        label="Ідентифікатор в адресі сторінки"
        value={slug}
        error={errors.slug}
        hint={`Адреса: /catalog/${slug || '…'} — латиниця, цифри, дефіс`}
        onChange={(event) => {
          setSlug(event.target.value.toLowerCase());
          setSlugTouched(true);
          setErrors((current) => withoutField(current, 'slug'));
        }}
      />

      <div className="form-field">
        <label className="form-field__label" htmlFor="category-parent">
          Батьківська категорія
        </label>
        <select
          id="category-parent"
          className={`form-field__input${errors.parentId ? ' form-field__input--invalid' : ''}`}
          value={parentId}
          disabled={hasChildren}
          aria-describedby="category-parent-hint"
          onChange={(event) => {
            setParentId(event.target.value);
            setErrors((current) => withoutField(current, 'parentId'));
          }}
        >
          <option value="">Немає — верхній рівень</option>
          {parents.map((item) => (
            // підкатегорії додають лише до категорії без товарів
            <option key={item.id} value={item.id} disabled={item.productsCount > 0}>
              {item.name}
              {item.productsCount > 0 ? ` (є товари: ${item.productsCount})` : ''}
            </option>
          ))}
        </select>
        {errors.parentId && <p className="form-field__error">{errors.parentId}</p>}
        <p id="category-parent-hint" className="form-field__hint">
          {hasChildren
            ? 'У категорії є підкатегорії, тож вона лишається верхнього рівня.'
            : 'Підкатегорію можна додати лише до категорії без товарів.'}
        </p>
      </div>

      <FormField
        id="category-order"
        label="Порядок показу"
        inputMode="numeric"
        value={order}
        error={errors.order}
        hint="Менше число — вище в меню"
        onChange={(event) => {
          setOrder(event.target.value);
          setErrors((current) => withoutField(current, 'order'));
        }}
      />
      <FormField
        id="category-template"
        label="Шаблон імпорту"
        value={importTemplate}
        error={errors.importTemplate}
        placeholder="Електрочайник, Чайник"
        hint="Слова через кому, з яких починається назва товару в прайсі Katran. Новий товар з такою назвою імпорт додасть сюди прихованим."
        onChange={(event) => {
          setImportTemplate(event.target.value);
          setErrors((current) => withoutField(current, 'importTemplate'));
        }}
      />

      <label className="admin-check">
        <input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} />
        Прихована — не показувати в каталозі разом з підкатегоріями й товарами
      </label>

      <button type="submit" className="cart-button account-form__submit" disabled={isSaving}>
        {isSaving ? 'Зберігаємо…' : category ? 'Зберегти' : 'Створити категорію'}
      </button>
    </form>
  );
}

function nextOrder(items: { order: number; parentId?: number | null }[], parentId: number | null): number {
  const siblings = items.filter((item) => item.parentId === undefined || item.parentId === parentId);
  return siblings.length ? Math.max(...siblings.map((item) => item.order)) + 1 : 1;
}

// ----- Шаблон характеристик -----

function CharacteristicsSection({ category }: { category: AdminCategory }) {
  const { data, error, isLoading, reload } = useAsync(
    () => adminCategoryService.listCharacteristics(category.id),
    [category.id],
  );
  // null — форма закрита, 'new' — нова характеристика, інакше — редагування
  const [editing, setEditing] = useState<Characteristic | 'new' | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const remove = async (item: Characteristic) => {
    setBusyId(item.id);
    try {
      await adminCategoryService.deleteCharacteristic(item.id);
      setConfirmId(null);
      if (editing !== null && editing !== 'new' && editing.id === item.id) setEditing(null);
      setMessage({ kind: 'success', text: `Характеристику «${item.name}» видалено.` });
      reload();
    } catch (failure) {
      setMessage({ kind: 'error', text: getErrorMessage(failure) });
    } finally {
      setBusyId(null);
    }
  };

  let list: ReactNode;
  if (error) list = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data) list = <ListState kind="loading" text="Завантажуємо шаблон…" />;
  else if (data.length === 0) {
    list = <ListState kind="empty" text="У шаблоні ще немає характеристик." />;
  } else {
    list = (
      <table className={`orders-table admin-template__table${isLoading ? ' orders-table--loading' : ''}`}>
        <thead>
          <tr>
            <th scope="col">Назва</th>
            <th scope="col">Тип</th>
            <th scope="col">Фільтр</th>
            <th scope="col">Порядок</th>
            <th scope="col">Товарів зі значенням</th>
            <th scope="col">
              <span className="visually-hidden">Дії</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td data-label="Назва">
                <strong>{item.name}</strong>
                {item.unit && <span className="admin-products__meta">одиниця: {item.unit}</span>}
              </td>
              <td data-label="Тип">
                {CHARACTERISTIC_TYPE_LABELS[item.type]}
                {item.type === 'enum' && <span className="admin-products__meta">{item.options.join(', ')}</span>}
              </td>
              <td data-label="Фільтр">{item.isFilter ? 'Так' : '—'}</td>
              <td data-label="Порядок">{item.order}</td>
              <td data-label="Товарів зі значенням">{item.valuesCount}</td>
              <td data-label="Дії" className="admin-products__actions">
                {confirmId === item.id ? (
                  <span className="admin-confirm admin-confirm--wrap" role="group" aria-label={`Видалити ${item.name}?`}>
                    <span className="admin-confirm__text">
                      {item.valuesCount > 0
                        ? `Товарів зі значенням: ${item.valuesCount} — значення буде видалено. Видалити?`
                        : 'Видалити?'}
                    </span>
                    <button
                      type="button"
                      className="link-button link-button--danger"
                      disabled={busyId === item.id}
                      onClick={() => remove(item)}
                    >
                      Так
                    </button>
                    <button type="button" className="link-button" onClick={() => setConfirmId(null)}>
                      Ні
                    </button>
                  </span>
                ) : (
                  <span className="admin-confirm">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => {
                        setEditing(item);
                        setMessage(null);
                      }}
                    >
                      Змінити
                    </button>
                    <button
                      type="button"
                      className="link-button link-button--danger"
                      onClick={() => setConfirmId(item.id)}
                    >
                      Видалити
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <section className="admin-template">
      <h3 className="admin-template__title">Шаблон характеристик</h3>
      <p className="admin-panel__text admin-template__text">
        Характеристики з’являються у формі товару й фільтрах каталогу одразу після збереження.
      </p>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
      {list}

      {editing === null ? (
        <button
          type="button"
          className="cart-button admin-template__add"
          onClick={() => {
            setEditing('new');
            setMessage(null);
          }}
        >
          + Додати характеристику
        </button>
      ) : (
        <CharacteristicForm
          key={editing === 'new' ? 'new' : editing.id}
          categoryId={category.id}
          characteristic={editing === 'new' ? null : editing}
          defaultOrder={nextOrder(data ?? [], null)}
          onCancel={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            setEditing(null);
            setMessage({
              kind: 'success',
              text: isNew ? `Характеристику «${saved.name}» додано.` : `Характеристику «${saved.name}» збережено.`,
            });
            reload();
          }}
        />
      )}
    </section>
  );
}

interface CharacteristicFormProps {
  categoryId: number;
  characteristic: Characteristic | null;
  defaultOrder: number;
  onCancel: () => void;
  onSaved: (characteristic: Characteristic, isNew: boolean) => void;
}

function CharacteristicForm({ categoryId, characteristic, defaultOrder, onCancel, onSaved }: CharacteristicFormProps) {
  const [name, setName] = useState(characteristic?.name ?? '');
  const [type, setType] = useState<CharacteristicType>(characteristic?.type ?? 'number');
  const [unit, setUnit] = useState(characteristic?.unit ?? '');
  const [options, setOptions] = useState(characteristic?.options.join('\n') ?? '');
  const [isFilter, setIsFilter] = useState(characteristic?.isFilter ?? true);
  const [order, setOrder] = useState(String(characteristic?.order ?? defaultOrder));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // тип характеристики, що має значення в товарах, змінюють видаленням і створенням заново
  const typeLocked = (characteristic?.valuesCount ?? 0) > 0;
  const optionCount = options.split('\n').filter((line) => line.trim()).length;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure('');
    const input: CharacteristicInput = {
      name,
      type,
      unit: type === 'number' || type === 'text' ? unit.trim() || null : null,
      isFilter,
      order: order.trim() === '' ? Number.NaN : Number(order),
      options: type === 'enum' ? options.split('\n').map((line) => line.trim()).filter(Boolean) : [],
    };
    const found = validateCharacteristicInput(input);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setIsSaving(true);
    try {
      const saved = characteristic
        ? await adminCategoryService.updateCharacteristic(characteristic.id, input)
        : await adminCategoryService.createCharacteristic(categoryId, input);
      onSaved(saved, characteristic === null);
    } catch (reason) {
      setIsSaving(false);
      const fields = fieldErrorsOf(reason);
      if (fields) setErrors(fields);
      else setFailure(`${getErrorMessage(reason)} Зміни не збережено.`);
    }
  };

  return (
    <form className="admin-panel admin-template__form" onSubmit={handleSubmit} noValidate>
      <h4 className="admin-panel__title">
        {characteristic ? `Змінити «${characteristic.name}»` : 'Нова характеристика'}
      </h4>
      {failure && <Notice kind="error">{failure}</Notice>}
      <div className="admin-edit__grid">
        <FormField
          id="characteristic-name"
          label="Назва"
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => withoutField(current, 'name'));
          }}
        />
        <div className="form-field">
          <label className="form-field__label" htmlFor="characteristic-type">
            Тип
          </label>
          <select
            id="characteristic-type"
            className={`form-field__input${errors.type ? ' form-field__input--invalid' : ''}`}
            value={type}
            disabled={typeLocked}
            aria-describedby={typeLocked ? 'characteristic-type-hint' : undefined}
            onChange={(event) => {
              setType(event.target.value as CharacteristicType);
              setErrors({});
            }}
          >
            {(Object.keys(CHARACTERISTIC_TYPE_LABELS) as CharacteristicType[]).map((value) => (
              <option key={value} value={value}>
                {CHARACTERISTIC_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
          {errors.type && <p className="form-field__error">{errors.type}</p>}
          {typeLocked && (
            <p id="characteristic-type-hint" className="form-field__hint">
              Товарів зі значенням: {characteristic?.valuesCount} — щоб змінити тип, видаліть характеристику й
              створіть заново.
            </p>
          )}
        </div>

        {type === 'enum' && (
          <div className="form-field admin-edit__wide">
            <label className="form-field__label" htmlFor="characteristic-options">
              Варіанти — кожен з нового рядка
            </label>
            <textarea
              id="characteristic-options"
              className={`form-field__input${errors.options ? ' form-field__input--invalid' : ''}`}
              rows={5}
              value={options}
              aria-describedby="characteristic-options-hint"
              onChange={(event) => {
                setOptions(event.target.value);
                setErrors((current) => withoutField(current, 'options'));
              }}
            />
            {errors.options && <p className="form-field__error">{errors.options}</p>}
            <p id="characteristic-options-hint" className="form-field__hint">
              Від 2 до 30 варіантів, зараз {optionCount}
            </p>
          </div>
        )}

        {(type === 'number' || type === 'text') && (
          <FormField
            id="characteristic-unit"
            label="Одиниця виміру"
            value={unit}
            error={errors.unit}
            placeholder="л, Вт, см"
            hint="Необов’язково"
            onChange={(event) => {
              setUnit(event.target.value);
              setErrors((current) => withoutField(current, 'unit'));
            }}
          />
        )}
        <FormField
          id="characteristic-order"
          label="Порядок"
          inputMode="numeric"
          value={order}
          error={errors.order}
          hint="У такому порядку — на картці товару й у фільтрах"
          onChange={(event) => {
            setOrder(event.target.value);
            setErrors((current) => withoutField(current, 'order'));
          }}
        />
      </div>

      <label className="admin-check">
        <input type="checkbox" checked={isFilter} onChange={(event) => setIsFilter(event.target.checked)} />
        Показувати як фільтр у каталозі
      </label>

      <div className="admin-template__buttons">
        <button type="submit" className="cart-button" disabled={isSaving}>
          {isSaving ? 'Зберігаємо…' : characteristic ? 'Зберегти' : 'Додати'}
        </button>
        <button type="button" className="link-button" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </form>
  );
}
