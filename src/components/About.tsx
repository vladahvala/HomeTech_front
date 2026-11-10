import { SITE_NAME } from '../data/site';

export default function About({ advantages }: { advantages: string[] }) {
  return (
    <div className="about">
      <div className="about__column">
        <h2 className="about__title">Про {SITE_NAME}</h2>
        <p className="about__text">
          {SITE_NAME} — магазин техніки для дому, роботи та відпочинку. У нашому каталозі представлені
          смартфони, комп'ютерна техніка, аудіопристрої та корисні аксесуари. Ми прагнемо зробити вибір
          техніки простим і зручним.
        </p>
      </div>
      <div className="about__column" id="advantages">
        <h2 className="about__title">Наші переваги</h2>
        <ul className="about__list">
          {advantages.map((a) => <li key={a} className="about__item">{a}</li>)}
        </ul>
      </div>
      <div className="about__column" id="delivery">
        <h2 className="about__title">Доставка та оплата</h2>
        <p className="about__text">
          Інформацію про способи доставки, терміни та оплату уточнюйте у менеджера магазину.
        </p>
      </div>
    </div>
  );
}