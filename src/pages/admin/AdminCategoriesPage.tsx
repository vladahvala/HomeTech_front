import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { adminCategoryService } from '../../api';
import { getErrorMessage } from '../../api/ApiError';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import { useAsync } from '../../hooks/useAsync';
import { invalidateCategories } from '../../hooks/useCategories';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminCategory } from '../../types';
import { categoryTree } from '../../utils/categoryTree';
import type { CategoryTreeRow } from '../../utils/categoryTree';

type Message = { kind: 'success' | 'error'; text: string };

/** Чому категорію не можна видалити; null — можна */
function deleteBlocker(category: AdminCategory): string | null {
  if (category.childrenCount > 0) return 'є підкатегорії';
  if (category.productsCount > 0) return 'є товари';
  return null;
}

/** Категорії двох рівнів (UC-ADM-CTG-01) */
export default function AdminCategoriesPage() {
  useDocumentTitle('Категорії');
  const location = useLocation();
  const { data, error, isLoading, reload } = useAsync(() => adminCategoryService.listCategories(), []);
  const flash = (location.state as { flash?: string } | null)?.flash;
  const [message, setMessage] = useState<Message | null>(null);
  const shown = message ?? (flash ? { kind: 'success' as const, text: flash } : null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const remove = async (category: AdminCategory) => {
    setBusyId(category.id);
    try {
      await adminCategoryService.deleteCategory(category.id);
      invalidateCategories();
      setConfirmId(null);
      setMessage({ kind: 'success', text: `Категорію «${category.name}» видалено.` });
      reload();
    } catch (failure) {
      setMessage({ kind: 'error', text: getErrorMessage(failure) });
    } finally {
      setBusyId(null);
    }
  };

  const visibility = (row: CategoryTreeRow<AdminCategory>) => {
    if (row.category.hidden) return <span className="publish-state publish-state--off">Прихована</span>;
    if (row.parent?.hidden) {
      return <span className="publish-state publish-state--off">Прихована разом з «{row.parent.name}»</span>;
    }
    return <span className="publish-state publish-state--on">Показується</span>;
  };

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data) content = <ListState kind="loading" text="Завантажуємо категорії…" />;
  else if (data.length === 0) content = <ListState kind="empty" text="Категорій ще немає. Додайте першу." />;
  else {
    content = (
      <table className={`orders-table admin-categories${isLoading ? ' orders-table--loading' : ''}`}>
        <thead>
          <tr>
            <th scope="col">Назва</th>
            <th scope="col">Адреса</th>
            <th scope="col">Порядок</th>
            <th scope="col">Товарів</th>
            <th scope="col">Показ</th>
            <th scope="col">
              <span className="visually-hidden">Дії</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categoryTree(data).map((row) => {
            const { category } = row;
            const blocker = deleteBlocker(category);
            return (
              <tr key={category.id} className={row.depth ? 'admin-categories__child' : undefined}>
                <td data-label="Назва">
                  <Link className="admin-products__name" to={`/admin/categories/${category.id}`}>
                    {row.depth ? '↳ ' : ''}
                    {category.name}
                  </Link>
                </td>
                <td data-label="Адреса">
                  <code className="admin-categories__slug">/catalog/{category.slug}</code>
                </td>
                <td data-label="Порядок">{category.order}</td>
                <td data-label="Товарів">{category.childrenCount > 0 ? '—' : category.productsCount}</td>
                <td data-label="Показ">{visibility(row)}</td>
                <td data-label="Дії" className="admin-products__actions">
                  {confirmId === category.id ? (
                    <span className="admin-confirm" role="group" aria-label={`Видалити ${category.name}?`}>
                      <span className="admin-confirm__text">Видалити?</span>
                      <button
                        type="button"
                        className="link-button link-button--danger"
                        disabled={busyId === category.id}
                        onClick={() => remove(category)}
                      >
                        Так
                      </button>
                      <button type="button" className="link-button" onClick={() => setConfirmId(null)}>
                        Ні
                      </button>
                    </span>
                  ) : blocker ? (
                    // видаляють лише категорію без товарів і підкатегорій
                    <span className="admin-products__meta">Не видаляється: {blocker}</span>
                  ) : (
                    <button
                      type="button"
                      className="link-button link-button--danger"
                      onClick={() => setConfirmId(category.id)}
                    >
                      Видалити
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <AccountLayout title="Категорії">
      <div className="admin-toolbar">
        <Link className="cart-button admin-toolbar__add" to="/admin/categories/new">
          + Додати категорію
        </Link>
        <p className="admin-toolbar__text">
          Два рівні. Товари й шаблон характеристик — у категоріях без підкатегорій. Прихована категорія ховає свої
          підкатегорії й товари, не змінюючи їхньої публікації.
        </p>
      </div>
      {shown && <Notice kind={shown.kind}>{shown.text}</Notice>}
      {content}
    </AccountLayout>
  );
}
