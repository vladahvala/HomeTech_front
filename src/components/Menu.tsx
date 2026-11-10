import { NavLink as RouterNavLink } from 'react-router';
import type { NavLink } from '../types';
import CartWidget from './CartWidget';
import Logo from './Logo';
import UserMenu from './UserMenu';
import { useCanShop } from '../hooks/useCanShop';

export default function Menu({ links }: { links: NavLink[] }) {
  const canShop = useCanShop();

  return (
    <nav className="menu">
      <Logo className="menu__logo" />
      <div className="menu__list">
        {links.map((link) => (
          // поточний розділ підкреслено; «Головна» — лише на самій головній
          <RouterNavLink
            key={link.href}
            to={link.href}
            end={link.href === '/'}
            className={({ isActive }) => `menu__link${isActive ? ' menu__link--active' : ''}`}
          >
            <span className="menu__text">{link.label}</span>
          </RouterNavLink>
        ))}
      </div>
      <div className="menu__actions">
        <UserMenu />
        {/* адміністратору кошик не надано (FUN-01) */}
        {canShop && <CartWidget />}
      </div>
    </nav>
  );
}
