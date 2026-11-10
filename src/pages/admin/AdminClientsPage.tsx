import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { adminClientService } from '../../api';
import AccountLayout from '../../components/AccountLayout';
import ListState from '../../components/ListState';
import Notice from '../../components/Notice';
import Pager from '../../components/Pager';
import { useAsync } from '../../hooks/useAsync';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import type { AdminClientQuery, ClientStatus } from '../../types';
import { parseAdminClientQuery, toAdminClientParams } from '../../utils/adminClientQuery';
import { formatDateTime } from '../../utils/dates';

const STATUS_LABELS: Record<ClientStatus, string> = { active: 'Активні', deleted: 'Видалені' };

/** Клієнти: пошук серед активних або видалених (UC-ADM-CLI-01) */
export default function AdminClientsPage() {
  useDocumentTitle('Клієнти');
  const location = useLocation();
  const navigate = useNavigate();
  const query = parseAdminClientQuery(location.search);
  const queryKey = toAdminClientParams(query).toString();
  const { data, error, isLoading, reload } = useAsync(() => adminClientService.listClients(query), [queryKey]);
  const [search, setSearch] = useState(query.search ?? '');
  const flash = (location.state as { flash?: string } | null)?.flash;

  useEffect(() => {
    setSearch(query.search ?? '');
  }, [query.search]);

  const applyQuery = (next: AdminClientQuery) => {
    const params = toAdminClientParams(next).toString();
    navigate(`/admin/clients${params ? `?${params}` : ''}`, { state: { keepScroll: true } });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyQuery({ ...query, search: search.trim() || undefined, page: 1 });
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  let content: ReactNode;
  if (error) content = <ListState kind="error" error={error} onRetry={reload} />;
  else if (!data) content = <ListState kind="loading" text="Завантажуємо клієнтів…" />;
  else if (data.items.length === 0) {
    content = (
      <ListState
        kind="empty"
        text={
          query.search
            ? 'Немає клієнтів за цим запитом.'
            : query.status === 'deleted'
              ? 'Видалених клієнтів немає.'
              : 'Клієнтів ще немає.'
        }
      />
    );
  } else {
    content = (
      <>
        <p className="admin-orders__count" aria-live="polite">
          Знайдено: {data.total}
        </p>
        <table className={`orders-table admin-clients${isLoading ? ' orders-table--loading' : ''}`}>
          <thead>
            <tr>
              <th scope="col">Клієнт</th>
              <th scope="col">Email</th>
              <th scope="col">Телефон</th>
              <th scope="col">Зареєстровано</th>
              <th scope="col">Замовлень</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((client) => (
              <tr key={client.id}>
                <td data-label="Клієнт">
                  <Link className="admin-products__name" to={`/admin/clients/${client.id}`}>
                    {client.fullName}
                  </Link>
                </td>
                <td data-label="Email">{client.email}</td>
                <td data-label="Телефон">{client.phone}</td>
                <td data-label="Зареєстровано">{formatDateTime(client.registeredAt).slice(0, 10)}</td>
                <td data-label="Замовлень">{client.ordersCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager
          currentPage={query.page}
          totalPages={totalPages}
          hrefFor={(page) => {
            const params = toAdminClientParams({ ...query, page }).toString();
            return `/admin/clients${params ? `?${params}` : ''}`;
          }}
        />
      </>
    );
  }

  return (
    <AccountLayout title="Клієнти">
      <div className="admin-toolbar">
        <Link className="cart-button admin-toolbar__add" to="/admin/clients/new">
          + Додати клієнта
        </Link>
        <p className="admin-toolbar__text">Наприклад, для замовлення, прийнятого телефоном.</p>
      </div>

      <form className="admin-filters" onSubmit={handleSubmit} noValidate role="search">
        <fieldset className="admin-filters__statuses">
          <legend className="admin-filters__legend">Облікові записи</legend>
          {(Object.keys(STATUS_LABELS) as ClientStatus[]).map((status) => (
            <label key={status} className="admin-filters__chip">
              <input
                type="radio"
                name="client-status"
                checked={query.status === status}
                onChange={() => applyQuery({ ...query, status, page: 1 })}
              />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </fieldset>
        <div className="admin-filters__search-row">
          <label className="admin-filters__field">
            <span>Пошук</span>
            <input
              type="search"
              placeholder="ПІБ, email або телефон"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="admin-filters__actions">
            <button type="submit" className="cart-button">
              Знайти
            </button>
            <button type="button" className="link-button" onClick={() => applyQuery({ status: query.status, page: 1 })}>
              Скинути
            </button>
          </div>
        </div>
      </form>

      {flash && <Notice kind="success">{flash}</Notice>}
      {content}
    </AccountLayout>
  );
}
