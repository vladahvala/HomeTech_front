import { useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { adminCategoryService, adminManufacturerService, adminProductService } from '../../api';
import { ApiError, getErrorMessage } from '../../api/ApiError';
import type { FieldErrors } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import ProductImage from '../../components/ProductImage';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type {
  AdminCategory,
  AdminManufacturer,
  AdminProduct,
  Availability,
  Characteristic,
  CharacteristicValue,
  ProductInput,
} from '../../types';
import { categoryLabel, categoryTree } from '../../utils/categoryTree';
import { formatPrice } from '../../utils/format';
import { AVAILABILITY_LABELS } from '../../utils/labels';
import {
  DESCRIPTION_MAX,
  parseDecimal,
  PHOTO_TYPES,
  validatePhoto,
  validateProductInput,
} from '../../validation/rules';
import NotFoundPage from '../NotFoundPage';

type Message = { kind: 'success' | 'error'; text: string };

/** Додати товар (UC-ADM-PRD-02) або редагувати його (UC-ADM-PRD-03…05) */
export default function AdminProductPage() {
  const params = useParams();
  const isNew = params.id === undefined;
  const id = Number(params.id);
  const location = useLocation();
  const navigate = useNavigate();

  const refs = useAsync(
    () => Promise.all([adminCategoryService.listCategories(), adminManufacturerService.listManufacturers()]),
    [],
  );
  const loaded = useAsync(() => (isNew ? Promise.resolve(null) : adminProductService.getProduct(id)), [params.id]);
  // після збереження показуємо відповідь сервера одразу, без нового запиту
  const [updated, setUpdated] = useState<AdminProduct | null>(null);
  const product = updated && updated.id === id ? updated : loaded.data;

  const flash = (location.state as { flash?: string } | null)?.flash;
  const [message, setMessage] = useState<Message | null>(null);
  const shown = message ?? (flash ? { kind: 'success' as const, text: flash } : null);

  useDocumentTitle(isNew ? 'Новий товар' : product ? product.name : 'Товар');

  if (loaded.error instanceof ApiError && loaded.error.status === 404) {
    return <NotFoundPage message="Товар не знайдено — можливо, його видалили" />;
  }

  const handleChanged = (saved: AdminProduct, text: string) => {
    setUpdated(saved);
    setMessage({ kind: 'success', text });
  };

  let content: ReactNode;
  const error = loaded.error ?? refs.error;
  if (error) {
    content = (
      <ListState
        kind="error"
        error={error}
        onRetry={() => {
          loaded.reload();
          refs.reload();
        }}
      />
    );
  } else if (!refs.data || (!isNew && (!product || product.id !== id))) {
    content = <ListState kind="loading" />;
  } else {
    const [categories, manufacturers] = refs.data;
    content = (
      <div className="admin-edit">
        <div className="admin-edit__main">
          {shown && <Notice kind={shown.kind}>{shown.text}</Notice>}
          <ProductForm
            // не перестворюємо форму після завантаження фото — незбережені правки лишаються
            key={product ? product.id : 'new'}
            product={product ?? null}
            categories={categories}
            manufacturers={manufacturers}
            onSaved={(saved, wasPublished) => {
              if (isNew) {
                navigate(`/admin/products/${saved.id}`, {
                  state: {
                    flash: saved.published
                      ? 'Товар створено й опубліковано — він уже в каталозі.'
                      : 'Товар створено, але він прихований: щоб опублікувати, вкажіть категорію й ціну.',
                  },
                });
                return;
              }
              refs.reload(); // новий виробник з'явиться в підказках
              handleChanged(
                saved,
                wasPublished && !saved.published
                  ? 'Зміни збережено. Товар приховано з каталогу, бо бракує категорії чи ціни.'
                  : 'Зміни збережено.',
              );
            }}
            onError={(text) => setMessage({ kind: 'error', text })}
          />
        </div>

        <aside className="admin-edit__aside">
          {product ? (
            <>
              <PhotoPanel product={product} onChanged={handleChanged} />
              <PublishPanel product={product} onChanged={handleChanged} />
              <DeletePanel
                product={product}
                onDeleted={() =>
                  navigate('/admin/products', {
                    state: { flash: `«${product.name}» видалено. Замовлення з цим товаром збережено.` },
                  })
                }
              />
            </>
          ) : (
            <section className="admin-panel">
              <h3 className="admin-panel__title">Фото й публікація</h3>
              <p className="admin-panel__text">
                Фото можна додати після створення товару. Товар з категорією й ціною буде опубліковано одразу.
              </p>
            </section>
          )}
        </aside>
      </div>
    );
  }

  return (
    <AccountLayout
      title={isNew ? 'Новий товар' : 'Редагування товару'}
      crumbs={[
        { label: 'Товари', to: '/admin/products' },
        { label: isNew ? 'Новий товар' : (product?.name ?? 'Товар') },
      ]}
    >
      <p className="admin-edit__back">
        <Link to="/admin/products">← До списку товарів</Link>
      </p>
      {content}
    </AccountLayout>
  );
}

// ----- Форма товару -----

interface FormState {
  name: string;
  availability: Availability;
  categoryId: string;
  manufacturerName: string;
  article: string;
  price: string;
  warrantyMonths: string;
  description: string;
  assemblyCountry: string;
  assemblyCity: string;
  values: Record<number, string>;
}

const numberText = (value: number) => String(value).replace('.', ',');

function valuesToText(values: Record<number, CharacteristicValue>): Record<number, string> {
  const result: Record<number, string> = {};
  for (const [key, value] of Object.entries(values)) {
    result[Number(key)] = typeof value === 'number' ? numberText(value) : String(value);
  }
  return result;
}

function initialState(product: AdminProduct | null): FormState {
  return {
    name: product?.name ?? '',
    availability: product?.availability ?? 'in_stock',
    categoryId: product?.categoryId ? String(product.categoryId) : '',
    manufacturerName: product?.manufacturer?.name ?? '',
    article: product?.article ?? '',
    price: product?.price !== null && product?.price !== undefined ? numberText(product.price) : '',
    warrantyMonths: product?.warrantyMonths !== null && product?.warrantyMonths !== undefined ? String(product.warrantyMonths) : '',
    description: product?.description ?? '',
    assemblyCountry: product?.assemblyCountry ?? '',
    assemblyCity: product?.assemblyCity ?? '',
    values: product ? valuesToText(product.values) : {},
  };
}

/** Текст форми → дані для сервера; значення лише за шаблоном обраної категорії */
function toInput(form: FormState, template: Characteristic[]): ProductInput {
  const values: Record<number, CharacteristicValue> = {};
  for (const characteristic of template) {
    const raw = form.values[characteristic.id]?.trim() ?? '';
    if (!raw) continue;
    if (characteristic.type === 'number') values[characteristic.id] = parseDecimal(raw) ?? Number.NaN;
    else if (characteristic.type === 'boolean') values[characteristic.id] = raw === 'true';
    else values[characteristic.id] = raw;
  }
  const warranty = form.warrantyMonths.trim();
  return {
    name: form.name,
    availability: form.availability,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    manufacturerName: form.manufacturerName,
    article: form.article,
    price: parseDecimal(form.price),
    warrantyMonths: warranty ? Number(warranty) : null,
    description: form.description,
    assemblyCountry: form.assemblyCountry,
    assemblyCity: form.assemblyCity,
    values,
  };
}

interface ProductFormProps {
  product: AdminProduct | null;
  categories: AdminCategory[];
  manufacturers: AdminManufacturer[];
  onSaved: (product: AdminProduct, wasPublished: boolean) => void;
  onError: (message: string) => void;
}

function ProductForm({ product, categories, manufacturers, onSaved, onError }: ProductFormProps) {
  const [form, setForm] = useState<FormState>(() => initialState(product));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const categoryId = form.categoryId ? Number(form.categoryId) : null;
  // шаблон характеристик обраної категорії — з наступного запиту після змін в адмінці (SUP-02)
  const template = useAsync(
    () => (categoryId === null ? Promise.resolve([]) : adminCategoryService.listCharacteristics(categoryId)),
    [categoryId],
  );
  const characteristics = template.data ?? [];

  const tree = categoryTree(categories);
  const original = product?.categoryId ?? null;
  const originalCategory = categories.find((item) => item.id === original);
  // UC-ADM-PRD-03: зміна категорії видаляє значення характеристик попередньої
  const losesValues = product !== null && categoryId !== original && Object.keys(product.values).length > 0;

  const manufacturerName = form.manufacturerName.trim().toLocaleLowerCase('uk');
  const isNewManufacturer =
    manufacturerName !== '' && !manufacturers.some((item) => item.name.toLocaleLowerCase('uk') === manufacturerName);

  const update = (field: keyof Omit<FormState, 'values'>, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const changeCategory = (value: string) => {
    const nextId = value ? Number(value) : null;
    setForm((current) => ({
      ...current,
      categoryId: value,
      // повернулися до початкової категорії — повертаємо її значення
      values: product && nextId === product.categoryId ? valuesToText(product.values) : {},
    }));
    setErrors({});
  };

  const changeValue = (characteristicId: number, value: string) => {
    setForm((current) => ({ ...current, values: { ...current.values, [characteristicId]: value } }));
    setErrors((current) => {
      const next = { ...current };
      delete next[`value-${characteristicId}`];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (template.isLoading) return;
    const input = toInput(form, characteristics);
    const found = validateProductInput(input, characteristics);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setIsSaving(true);
    try {
      const saved = product
        ? await adminProductService.updateProduct(product.id, input)
        : await adminProductService.createProduct(input);
      setIsSaving(false);
      onSaved(saved, product?.published ?? false);
    } catch (failure) {
      setIsSaving(false);
      if (failure instanceof ApiError && Object.keys(failure.fields).length > 0) {
        setErrors(failure.fields);
        return;
      }
      onError(`${getErrorMessage(failure)} Зміни не збережено.`);
    }
  };

  const field = (name: keyof Omit<FormState, 'values'>, label: string, props: { hint?: string; inputMode?: 'decimal' | 'numeric'; placeholder?: string; wide?: boolean } = {}) => (
    <div className={`form-field${props.wide ? ' admin-edit__wide' : ''}`}>
      <label className="form-field__label" htmlFor={`product-${name}`}>
        {label}
      </label>
      <input
        id={`product-${name}`}
        className={`form-field__input${errors[name] ? ' form-field__input--invalid' : ''}`}
        value={form[name]}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `product-${name}-error` : props.hint ? `product-${name}-hint` : undefined}
        onChange={(event) => update(name, event.target.value)}
      />
      {errors[name] && (
        <p id={`product-${name}-error`} className="form-field__error">
          {errors[name]}
        </p>
      )}
      {props.hint && (
        <p id={`product-${name}-hint`} className="form-field__hint">
          {props.hint}
        </p>
      )}
    </div>
  );

  return (
    <form className="admin-edit__form" onSubmit={handleSubmit} noValidate>
      {product?.source === 'katran' && (
        <Notice kind="info" title={`Товар із прайсу Katran, код ${product.supplierCode}`}>
          Наступний імпорт оновить ціну, закупівельну ціну, наявність, гарантію й фото з прайсу; решту полів збереже.
          {product.purchasePrice !== null && <> Закупівельна ціна: {formatPrice(product.purchasePrice)}.</>}
        </Notice>
      )}

      <div className="admin-edit__grid">
        {field('name', 'Назва', { wide: true, hint: 'Від 3 до 200 символів' })}

        <div className="form-field">
          <label className="form-field__label" htmlFor="product-availability">
            Наявність
          </label>
          <select
            id="product-availability"
            className="form-field__input"
            value={form.availability}
            onChange={(event) => update('availability', event.target.value)}
          >
            {(Object.keys(AVAILABILITY_LABELS) as Availability[]).map((value) => (
              <option key={value} value={value}>
                {AVAILABILITY_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="product-category">
            Категорія
          </label>
          <select
            id="product-category"
            className={`form-field__input${errors.categoryId ? ' form-field__input--invalid' : ''}`}
            value={form.categoryId}
            aria-invalid={errors.categoryId ? true : undefined}
            aria-describedby="product-category-hint"
            onChange={(event) => changeCategory(event.target.value)}
          >
            <option value="">Без категорії (товар буде прихований)</option>
            {tree.map((row) => (
              // товари призначають лише категоріям без підкатегорій
              <option key={row.category.id} value={row.category.id} disabled={row.category.childrenCount > 0}>
                {categoryLabel(row)}
                {row.category.hidden ? ' (прихована)' : ''}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="form-field__error">{errors.categoryId}</p>}
          <p id="product-category-hint" className="form-field__hint">
            Лише категорії без підкатегорій
          </p>
        </div>

        <div className="form-field">
          <label className="form-field__label" htmlFor="product-manufacturerName">
            Виробник
          </label>
          <input
            id="product-manufacturerName"
            className={`form-field__input${errors.manufacturerName ? ' form-field__input--invalid' : ''}`}
            list="product-manufacturers"
            value={form.manufacturerName}
            aria-describedby="product-manufacturer-hint"
            onChange={(event) => update('manufacturerName', event.target.value)}
          />
          <datalist id="product-manufacturers">
            {manufacturers.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
          {errors.manufacturerName && <p className="form-field__error">{errors.manufacturerName}</p>}
          <p id="product-manufacturer-hint" className="form-field__hint">
            {isNewManufacturer
              ? `Нового виробника «${form.manufacturerName.trim()}» буде створено.`
              : 'Оберіть зі списку або введіть нову назву.'}
          </p>
        </div>

        {field('article', 'Артикул')}
        {field('price', 'Ціна, грн', { inputMode: 'decimal', placeholder: '1299,50', hint: 'Без ціни товар не публікується' })}
        {field('warrantyMonths', 'Гарантія, місяців', { inputMode: 'numeric', hint: 'Від 0 до 120' })}
        {field('assemblyCountry', 'Країна збирання')}
        {field('assemblyCity', 'Місто збирання')}

        <div className="form-field admin-edit__wide">
          <label className="form-field__label" htmlFor="product-description">
            Опис
          </label>
          <textarea
            id="product-description"
            className={`form-field__input${errors.description ? ' form-field__input--invalid' : ''}`}
            rows={5}
            value={form.description}
            aria-describedby="product-description-counter"
            onChange={(event) => update('description', event.target.value)}
          />
          {errors.description && <p className="form-field__error">{errors.description}</p>}
          <p
            id="product-description-counter"
            className={`form-field__hint${form.description.length > DESCRIPTION_MAX ? ' form-field__hint--over' : ''}`}
          >
            {form.description.length} / {DESCRIPTION_MAX}
          </p>
        </div>
      </div>

      <fieldset className="admin-edit__specs">
        <legend className="admin-edit__legend">Характеристики</legend>
        {losesValues && (
          <Notice kind="warning">
            Після збереження значення характеристик категорії «{originalCategory?.name ?? 'попередньої'}» буде
            видалено — у нової категорії свій шаблон.
          </Notice>
        )}
        {categoryId === null ? (
          <p className="admin-panel__text">Оберіть категорію — тут з’являться характеристики з її шаблону.</p>
        ) : template.error ? (
          <ListState kind="error" error={template.error} onRetry={template.reload} />
        ) : template.isLoading && !template.data ? (
          <ListState kind="loading" text="Завантажуємо шаблон…" />
        ) : characteristics.length === 0 ? (
          <p className="admin-panel__text">
            У шаблоні категорії ще немає характеристик.{' '}
            <Link to={`/admin/categories/${categoryId}`}>Додати характеристики</Link>
          </p>
        ) : (
          <div className="admin-edit__grid">
            {characteristics.map((characteristic) => (
              <CharacteristicField
                key={characteristic.id}
                characteristic={characteristic}
                value={form.values[characteristic.id] ?? ''}
                error={errors[`value-${characteristic.id}`]}
                onChange={(value) => changeValue(characteristic.id, value)}
              />
            ))}
          </div>
        )}
      </fieldset>

      {Object.keys(errors).length > 0 && (
        <p className="form-field__error" role="alert">
          Перевірте виділені поля.
        </p>
      )}
      <button type="submit" className="cart-button admin-edit__submit" disabled={isSaving || template.isLoading}>
        {isSaving ? 'Зберігаємо…' : product ? 'Зберегти зміни' : 'Створити товар'}
      </button>
    </form>
  );
}

interface CharacteristicFieldProps {
  characteristic: Characteristic;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

/** Поле значення за типом характеристики: число, перелік, так/ні, текст */
function CharacteristicField({ characteristic, value, error, onChange }: CharacteristicFieldProps) {
  const id = `value-${characteristic.id}`;
  const label = characteristic.unit ? `${characteristic.name}, ${characteristic.unit}` : characteristic.name;
  const className = `form-field__input${error ? ' form-field__input--invalid' : ''}`;
  const common = {
    id,
    className,
    value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };

  let control: ReactNode;
  if (characteristic.type === 'enum' || characteristic.type === 'boolean') {
    const options =
      characteristic.type === 'boolean'
        ? [
            { value: 'true', label: 'Так' },
            { value: 'false', label: 'Ні' },
          ]
        : characteristic.options.map((option) => ({ value: option, label: option }));
    control = (
      <select {...common} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}>
        <option value="">Не вказано</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        {...common}
        inputMode={characteristic.type === 'number' ? 'decimal' : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
      />
    );
  }

  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      {control}
      {error && (
        <p id={`${id}-error`} className="form-field__error">
          {error}
        </p>
      )}
    </div>
  );
}

// ----- Панелі праворуч -----

interface PanelProps {
  product: AdminProduct;
  onChanged: (product: AdminProduct, message: string) => void;
}

/** Власне фото: завантажити або видалити (UC-ADM-PRD-03, FUN-10) */
function PhotoPanel({ product, onChanged }: PanelProps) {
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const image = product.ownImageUrl ?? product.supplierImageUrl;
  const caption = product.ownImageUrl
    ? 'Власне фото'
    : product.supplierImageUrl
      ? 'Фото з прайсу Katran'
      : 'Фото немає — у каталозі заглушка';

  const run = async (action: () => Promise<AdminProduct>, success: string) => {
    setError('');
    setIsSaving(true);
    try {
      onChanged(await action(), success);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // щоб той самий файл можна було обрати вдруге
    if (!file) return;
    const message = validatePhoto(file);
    if (message) {
      setError(message);
      return;
    }
    void run(() => adminProductService.uploadPhoto(product.id, file), 'Фото завантажено.');
  };

  return (
    <section className="admin-panel">
      <h3 className="admin-panel__title">Фото</h3>
      <ProductImage className="admin-edit__photo" src={image} alt={product.name} />
      <p className="admin-panel__text admin-edit__caption">{caption}</p>
      <label className={`cart-button admin-panel__submit admin-edit__upload${isSaving ? ' admin-edit__upload--busy' : ''}`}>
        {isSaving ? 'Зберігаємо…' : product.ownImageUrl ? 'Замінити фото' : 'Завантажити фото'}
        <input
          type="file"
          className="visually-hidden"
          accept={PHOTO_TYPES.join(',')}
          disabled={isSaving}
          onChange={handleFile}
        />
      </label>
      <p className="form-field__hint">JPEG, PNG або WebP до 5 МБ</p>
      {product.ownImageUrl && (
        <button
          type="button"
          className="link-button link-button--danger admin-edit__remove-photo"
          disabled={isSaving}
          onClick={() => run(() => adminProductService.deletePhoto(product.id), 'Власне фото видалено.')}
        >
          Видалити власне фото
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

/** Опублікувати або приховати (UC-ADM-PRD-05) */
function PublishPanel({ product, onChanged }: PanelProps) {
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggle = async () => {
    setError('');
    setIsSaving(true);
    try {
      const saved = await adminProductService.setPublished(product.id, !product.published);
      onChanged(saved, saved.published ? 'Товар опубліковано.' : 'Товар приховано з каталогу.');
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="admin-panel">
      <h3 className="admin-panel__title">Показ у каталозі</h3>
      <p className="admin-panel__text">
        <span className={`publish-state publish-state--${product.published ? 'on' : 'off'}`}>
          {product.published ? 'Опубліковано' : 'Приховано'}
        </span>{' '}
        {product.published ? (
          <Link to={`/product/${product.id}`}>Відкрити в каталозі</Link>
        ) : (
          'Покупці товар не бачать; у замовленнях він лишається.'
        )}
      </p>
      <button type="button" className="cart-button admin-panel__submit" disabled={isSaving} onClick={toggle}>
        {isSaving ? 'Зберігаємо…' : product.published ? 'Приховати' : 'Опублікувати'}
      </button>
      {error && (
        <p className="form-field__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** Видалити з підтвердженням (UC-ADM-PRD-04) */
function DeletePanel({ product, onDeleted }: { product: AdminProduct; onDeleted: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const remove = async () => {
    setError('');
    setIsSaving(true);
    try {
      await adminProductService.deleteProduct(product.id);
      onDeleted();
    } catch (failure) {
      setIsSaving(false);
      setError(getErrorMessage(failure));
    }
  };

  return (
    <section className="admin-panel">
      <h3 className="admin-panel__title">Видалення</h3>
      {isConfirming ? (
        <>
          <p className="admin-panel__text">
            Видалити «{product.name}»? Товар зникне з каталогу, пошуку й цього списку, а імпорт його пропускатиме.
            Замовлення з ним збережуться.
          </p>
          <button
            type="button"
            className="cart-button admin-panel__submit admin-panel__submit--danger"
            disabled={isSaving}
            onClick={remove}
          >
            {isSaving ? 'Видаляємо…' : 'Так, видалити'}
          </button>
          <button type="button" className="link-button admin-edit__cancel" onClick={() => setIsConfirming(false)}>
            Скасувати
          </button>
        </>
      ) : (
        <button type="button" className="link-button link-button--danger" onClick={() => setIsConfirming(true)}>
          Видалити товар
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
