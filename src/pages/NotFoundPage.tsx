import { Link } from 'react-router';

export default function NotFoundPage({ message = 'Сторінку не знайдено' }: { message?: string }) {
  return (
    <main className="not-found">
      <h2 className="not-found__title">{message}</h2>
      <Link className="cart-button not-found__link" to="/">
        На головну
      </Link>
    </main>
  );
}
