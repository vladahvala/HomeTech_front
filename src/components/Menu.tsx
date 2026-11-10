import { Link } from 'react-router';
import type { NavLink } from '../types';
import CartWidget from './CartWidget';
import Logo from './Logo';
import UserMenu from './UserMenu';

export default function Menu({ links }: { links: NavLink[] }) {
  return (
    <nav className="menu">
      <Logo className="menu__logo" />
      <div className="menu__list">
        {links.map((link) => (
          <Link key={link.href} to={link.href} className="menu__link">
            <span className="menu__text">{link.label}</span>
          </Link>
        ))}
      </div>
      <div className="menu__actions">
        <UserMenu />
        <CartWidget />
      </div>
    </nav>
  );
}
