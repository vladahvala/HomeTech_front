import { Link } from 'react-router';
import { SELLER, SITE_NAME } from '../data/site';
import type { NavLink, SocialLink } from '../types';

export default function Footer({ links, socialLinks }: { links: NavLink[]; socialLinks: SocialLink[] }) {
  return (
    <footer className="footer" id="contacts">
      <div className="footer__container">
        <div className="footer__column">
          <h3 className="footer__title">Контакти</h3>
          {/* найменування, адреса й телефон продавця на кожній сторінці (FUN-11) */}
          <p className="footer__text">{SELLER.name}</p>
          <p className="footer__text">Адреса: {SELLER.address}</p>
          <p className="footer__text">
            Телефон:{' '}
            <a className="footer__link" href={SELLER.phoneHref}>
              {SELLER.phone}
            </a>
          </p>
          <p className="footer__text">
            Email:{' '}
            <a className="footer__link" href={`mailto:${SELLER.email}`}>
              {SELLER.email}
            </a>
          </p>
        </div>
        <div className="footer__column">
          <h3 className="footer__title">Інформація</h3>
          <ul className="footer__list">
            {links.map((link) => (
              <li key={link.href} className="footer__item">
                <Link className="footer__link" to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer__column">
          <h3 className="footer__title">Ми в соцмережах</h3>
          <div className="social-links">
            {socialLinks.map((s) => (
              <a key={s.label} className="social-links__link" href={s.href} aria-label={s.label}>
                <i className={`social-links__icon ${s.icon}`} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <p className="footer__copy">&copy; {new Date().getFullYear()} {SITE_NAME}. Навчальний проєкт.</p>
      </div>
    </footer>
  );
}