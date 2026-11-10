import type { NavLink } from '../types';
import Logo from './Logo';

export default function Menu({ links }: { links: NavLink[] }) {
  return (
    <nav className="menu">
      <Logo className="menu__logo" />
      <div className="menu__list">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="menu__link">
            <span className="menu__text">{link.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}