import { Link } from 'react-router';
import { SITE_NAME } from '../data/site';

/** Коротко про магазин на головній: хто ми, переваги, доставка */
export default function About({ advantages }: { advantages: string[] }) {
  return (
    <div className="about">
      <div className="about__column">
        <h2 className="about__title">Про {SITE_NAME}</h2>
        <p className="about__text">
          {SITE_NAME} — інтернет-магазин побутової техніки для кухні й дому: холодильники, чайники, мікрохвильові
          печі, витяжки, пилососи. Обирайте за характеристиками, порівнюйте ціни й оформлюйте замовлення з
          доставкою.
        </p>
      </div>
      <div className="about__column">
        <h2 className="about__title">Наші переваги</h2>
        <ul className="about__list">
          {advantages.map((a) => <li key={a} className="about__item">{a}</li>)}
        </ul>
      </div>
      <div className="about__column">
        <h2 className="about__title">Доставка та оплата</h2>
        <p className="about__text">
          Самовивіз з магазину, кур’єр по місту або Нова пошта. Оплата готівкою чи карткою при отриманні,
          накладеним платежем або за рахунком.{' '}
          <Link className="about__link" to="/delivery">
            Докладніше про доставку й оплату
          </Link>
        </p>
      </div>
    </div>
  );
}
