import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { adminCategoryService, adminManufacturerService, adminProductService } from '../../api';
import { getErrorMessage } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import AvailabilityBadge from '../../components/AvailabilityBadge';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import Pager from '../../components/Pager';
import ProductImage from '../../components/ProductImage';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminCategory, AdminManufacturer, AdminProductListItem, AdminProductQuery, Availability, ProductSource } from '../../types';
import { parseAdminProductQuery, toAdminProductParams } from '../../utils/adminProductQuery';
import { categoryLabel, categoryTree } from '../../utils/categoryTree';
import { formatPrice } from '../../utils/format';
import { AVAILABILITY_LABELS, SOURCE_LABELS } from '../../utils/labels';

type Message = { kind: 'success' | 'error'; text: string };

/** Товари магазину з пошуком і фільтрами (UC-ADM-PRD-01, 04, 05) */
export default function AdminProductsPage() {
  useDocumentTitle('Товари');
  const location = useLocation();
  const navigate = useNavigate();
  const query = parseAdminProductQuery(location.search);
  const queryKey = toAdminProductParams(query).toString();

  const list = useAsync(() => adminProductService.listProducts(query), [queryKey]);
  // для фільтрів: категорії й виробники; помилка тут не заважає працювати зі списком
  const refs = useAsync(
    () => Promise.all([adminCategoryService.listCategories(), adminManufacturerService.listManufacturers()]),
    [],
  );

  // повідомлення після створення чи видалення на іншій сторінці
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [message, setMessage] = useState<Message | null>(flash ? { kind: 'success', text: flash } : null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (flash) setMessage({ kind: 'success', text: flash });
  }, [flash]);

  const applyQuery = (next: AdminProductQuery) => {
    const params = toAdminProductParams(next).toString();
    navigate(`/admin/products${params ? `?${params}` : ''}`, { state: { keepScroll: true } });
  };

  const togglePublished = async (product: AdminProductListItem) => {
    setBusyId(product.id);
    setMessage(null);
    try {
      const saved = await adminProductService.setPublished(product.id, !product.published);
      setMessage({
        kind: 'success',
        text: saved.published ? `«${saved.name}» опубліковано.` : `«${saved.name}» приховано з каталогу.`,
      });
      list.reload();
    } catch (failure) {
      // А: товар без категорії чи ціни — сервер каже, чого бракує (UC-ADM-PRD-05)
      setMessage({ kind: 'error', text: getErrorMessage(failure) });
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (product: AdminProductListItem) => {
    setBusyId(product.id);
    setMessage(null);
    try {
      await adminProductService.deleteProduct(product.id);
      setConfirmId(null);
      setMessage({ kind: 'success', text: `«${product.name}» видалено. Замовлення з цим товаром збережено.` });
      list.reload();
    } catch (failure) {
      setMessage({ kind: 'error', text: getErrorMessage(failure) });
    } finally {
      setBusyId(null);
    }
  };

  const hasFilters =
    !!query.search ||
    query.category !== undefined ||
    query.manufacturer !== undefined ||
    query.published !== undefined ||
    !!query.availability ||
    !!query.source;

  const { data, error, isLoading, reload } = list;
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data) content = <ListState kind="loading" text="Завантажуємо товари…" />;
  else if (data.items.length === 0) {
    content = (
      <ListState kind="empty" text={hasFilters ? 'Немає товарів за цими фільтрами.' : 'Товарів ще немає.'}>
        {hasFilters && (
          <button type="button" className="cart-button list-state__retry" onClick={() => applyQuery({ page: 1 })}>
            Скинути фільтри
          </button>
        )}
      </ListState>
    );
  } else {
    content = (
      <>
        <p className="admin-orders__count" aria-live="polite">
          Знайдено: {data.total}
        </p>
        <table className={`orders-table admin-products__table${isLoading ? ' orders-table--loading' : ''}`}>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Фото</span>
              </th>
              <th scope="col">Товар</th>
              <th scope="col">Категорія</th>
              <th scope="col">Ціна</th>
              <th scope="col">Наявність</th>
              <th scope="col">Показ</th>
              <th scope="col">
                <span className="visually-hidden">Дії</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((product) => (
              <tr key={product.id}>
                <td className="admin-products__photo-cell">
                  <ProductImage className="admin-products__photo" src={product.imageUrl} alt="" />
                </td>
                <td data-label="Товар">
                  <Link className="admin-products__name" to={`/admin/products/${product.id}`}>
                    {product.name}
                  </Link>
                  <span className="admin-products__meta">
                    {[
                      product.article && `арт. ${product.article}`,
                      product.supplierCode ? `код ${product.supplierCode}` : SOURCE_LABELS.manual,
                      product.manufacturerName,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </td>
                <td data-label="Категорія">
                  {product.categoryName ?? <span className="admin-products__missing">без категорії</span>}
                </td>
                <td data-label="Ціна">
                  {product.price !== null ? (
                    formatPrice(product.price)
                  ) : (
                    <span className="admin-products__missing">немає ціни</span>
                  )}
                  {product.purchasePrice !== null && (
                    <span className="admin-products__meta">закуп. {formatPrice(product.purchasePrice)}</span>
                  )}
                </td>
                <td data-label="Наявність">
                  <AvailabilityBadge availability={product.availability} />
                </td>
                <td data-label="Показ">
                  <span className={`publish-state publish-state--${product.published ? 'on' : 'off'}`}>
                    {product.published ? 'Опубліковано' : 'Приховано'}
                  </span>
                  <button
                    type="button"
                    className="link-button admin-products__action"
                    disabled={busyId === product.id}
                    onClick={() => togglePublished(product)}
                  >
                    {product.published ? 'Приховати' : 'Опублікувати'}
                  </button>
                </td>
                <td data-label="Дії" className="admin-products__actions">
                  {confirmId === product.id ? (
                    <span className="admin-confirm" role="group" aria-label={`Видалити ${product.name}?`}>
                      <span className="admin-confirm__text">Видалити?</span>
                      <button
                        type="button"
                        className="link-button link-button--danger"
                        disabled={busyId === product.id}
                        onClick={() => deleteProduct(product)}
                      >
                        Так
                      </button>
                      <button type="button" className="link-button" onClick={() => setConfirmId(null)}>
                        Ні
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="link-button link-button--danger"
                      onClick={() => setConfirmId(product.id)}
                    >
                      Видалити
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager
          currentPage={query.page}
          totalPages={totalPages}
          hrefFor={(page) => {
            const params = toAdminProductParams({ ...query, page }).toString();
            return `/admin/products${params ? `?${params}` : ''}`;
          }}
        />
      </>
    );
  }

  return (
    <AccountLayout title="Товари">
      <div className="admin-toolbar">
        <Link className="cart-button admin-toolbar__add" to="/admin/products/new">
          + Додати товар
        </Link>
      </div>
      <ProductFilters
        query={query}
        categories={refs.data?.[0] ?? []}
        manufacturers={refs.data?.[1] ?? []}
        onApply={applyQuery}
      />
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
      {content}
    </AccountLayout>
  );
}

interface ProductFiltersProps {
  query: AdminProductQuery;
  categories: AdminCategory[];
  manufacturers: AdminManufacturer[];
  onApply: (query: AdminProductQuery) => void;
}

/** Пошук (кнопкою «Знайти») і фільтри (одразу) */
function ProductFilters({ query, categories, manufacturers, onApply }: ProductFiltersProps) {
  const [search, setSearch] = useState(query.search ?? '');

  // «Назад» чи «Скинути» змінили адресу — оновлюємо поле
  useEffect(() => {
    setSearch(query.search ?? '');
  }, [query.search]);

  const apply = (patch: Partial<AdminProductQuery>) => onApply({ ...query, ...patch, page: 1 });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply({ search: search.trim() || undefined });
  };

  return (
    <form className="admin-filters" onSubmit={handleSubmit} noValidate role="search">
      <div className="admin-filters__fields admin-filters__fields--products">
        <label className="admin-filters__field admin-filters__field--wide">
          <span>Пошук</span>
          <input
            type="search"
            placeholder="Назва, артикул або код постачальника"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="admin-filters__field">
          <span>Категорія</span>
          <select
            value={query.category ?? ''}
            onChange={(event) => {
              const value = event.target.value;
              apply({ category: value === '' ? undefined : value === 'none' ? 'none' : Number(value) });
            }}
          >
            <option value="">Усі</option>
            <option value="none">Без категорії</option>
            {categoryTree(categories).map((row) => (
              <option key={row.category.id} value={row.category.id}>
                {categoryLabel(row)}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filters__field">
          <span>Виробник</span>
          <select
            value={query.manufacturer ?? ''}
            onChange={(event) => apply({ manufacturer: event.target.value ? Number(event.target.value) : undefined })}
          >
            <option value="">Усі</option>
            {manufacturers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filters__field">
          <span>Показ</span>
          <select
            value={query.published === undefined ? '' : String(query.published)}
            onChange={(event) =>
              apply({ published: event.target.value === '' ? undefined : event.target.value === 'true' })
            }
          >
            <option value="">Усі</option>
            <option value="true">Опубліковані</option>
            <option value="false">Приховані</option>
          </select>
        </label>
        <label className="admin-filters__field">
          <span>Наявність</span>
          <select
            value={query.availability ?? ''}
            onChange={(event) => apply({ availability: (event.target.value || undefined) as Availability | undefined })}
          >
            <option value="">Усі</option>
            {(Object.keys(AVAILABILITY_LABELS) as Availability[]).map((value) => (
              <option key={value} value={value}>
                {AVAILABILITY_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filters__field">
          <span>Джерело</span>
          <select
            value={query.source ?? ''}
            onChange={(event) => apply({ source: (event.target.value || undefined) as ProductSource | undefined })}
          >
            <option value="">Усі</option>
            {(Object.keys(SOURCE_LABELS) as ProductSource[]).map((value) => (
              <option key={value} value={value}>
                {SOURCE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-filters__actions">
          <button type="submit" className="cart-button">
            Знайти
          </button>
          <button type="button" className="link-button" onClick={() => onApply({ page: 1 })}>
            Скинути
          </button>
        </div>
      </div>
    </form>
  );
}
