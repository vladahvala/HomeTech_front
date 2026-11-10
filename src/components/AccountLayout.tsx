import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from './Breadcrumbs';
import type { Crumb } from './Breadcrumbs';

interface AccountLayoutProps {
  title: string;
  /** Додаткові крихти після «Особистий кабінет» */
  crumbs?: Crumb[];
  children: ReactNode;
}

/** Каркас кабінету клієнта й адмінки: меню розділів ліворуч, вміст праворуч */
export default function AccountLayout({ title, crumbs = [], children }: AccountLayoutProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const links = isAdmin
    ? [
        { to: '/admin/orders', label: 'Замовлення' },
        { to: '/account/password', label: 'Зміна пароля' },
      ]
    : [
        { to: '/account/orders', label: 'Мої замовлення' },
        { to: '/account/profile', label: 'Профіль' },
        { to: '/account/password', label: 'Зміна пароля' },
      ];

  return (
    <main className="account-page">
      <Breadcrumbs
        items={[
          { label: 'Головна', to: '/' },
          isAdmin
            ? { label: 'Адмінка', to: '/admin/orders' }
            : { label: 'Особистий кабінет', to: '/account/orders' },
          ...crumbs,
        ]}
      />

      <div className="account-page__layout">
        <nav className="account-nav" aria-label="Розділи кабінету">
          <p className="account-nav__user">{user?.fullName}</p>
          {/* NavLink підсвічує розділ і на вкладених сторінках (/account/orders/DT-000001) */}
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `account-nav__link${isActive ? ' account-nav__link--active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="account-page__content">
          <h2 className="account-page__title">{title}</h2>
          {children}
        </div>
      </div>
    </main>
  );
}
