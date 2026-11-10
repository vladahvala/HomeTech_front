import { Link } from 'react-router';
import Breadcrumbs from '../components/Breadcrumbs';
import { SELLER } from '../data/site';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/** Контакти продавця (FUN-11); ті самі дані — у футері кожної сторінки */
export default function ContactsPage() {
  useDocumentTitle('Контакти');

  return (
    <main className="info-page">
      <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Контакти' }]} />
      <h2 className="info-page__title">Контакти</h2>

      <div className="info-cards info-cards--contacts">
        <article className="info-cards__item">
          <i className="info-cards__icon ri-store-2-line" aria-hidden="true" />
          <h3 className="info-cards__title">Продавець</h3>
          <p className="info-cards__text">{SELLER.name}</p>
        </article>
        <article className="info-cards__item">
          <i className="info-cards__icon ri-map-pin-line" aria-hidden="true" />
          <h3 className="info-cards__title">Адреса</h3>
          <p className="info-cards__text">{SELLER.address}</p>
        </article>
        <article className="info-cards__item">
          <i className="info-cards__icon ri-phone-line" aria-hidden="true" />
          <h3 className="info-cards__title">Телефон</h3>
          <p className="info-cards__text">
            <a href={SELLER.phoneHref}>{SELLER.phone}</a>
          </p>
        </article>
        <article className="info-cards__item">
          <i className="info-cards__icon ri-mail-line" aria-hidden="true" />
          <h3 className="info-cards__title">Email</h3>
          <p className="info-cards__text">
            <a href={`mailto:${SELLER.email}`}>{SELLER.email}</a>
          </p>
        </article>
      </div>

      <p className="info-page__text info-page__note">
        Це навчальний проєкт: адреса й телефон умовні, замовлення не виконуються насправді.
      </p>

      <section className="info-page__section" aria-labelledby="contacts-help">
        <h3 id="contacts-help" className="info-page__subtitle">
          Питання про замовлення
        </h3>
        <p className="info-page__text">
          Статус, історію змін і примітки магазину до кожного замовлення видно в{' '}
          <Link to="/account/orders">особистому кабінеті</Link>. Як отримати й оплатити замовлення — на сторінці{' '}
          <Link to="/delivery">«Доставка та оплата»</Link>.
        </p>
      </section>
    </main>
  );
}
