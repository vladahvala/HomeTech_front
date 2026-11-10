import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import AvailabilityBadge from '../components/AvailabilityBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import ListState from '../components/ListState';
import Notice from '../components/Notice';
import ProductImage from '../components/ProductImage';
import QuantityPicker from '../components/QuantityPicker';
import { MAX_QUANTITY, useCart } from '../context/CartContext';
import { isBlocking, useCartCheck } from '../hooks/useCartCheck';
import { useCanShop } from '../hooks/useCanShop';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../utils/format';

/** Кошик (UC-CRT-03): кількість, видалення, звірка цін і наявності, перехід до оформлення */
export default function CartPage() {
  useDocumentTitle('Кошик');
  const location = useLocation();
  const { items, setQuantity, removeFromCart } = useCart();
  const { lines, total, priceChanges, hasBlocking, isChecking, error, recheck, acceptPrices } =
    useCartCheck();

  // старі ціни, які Клієнт бачив до звірки, — щоб показати «було → стало»
  const [oldPrices, setOldPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    if (priceChanges.length === 0) return;
    setOldPrices((current) => {
      const next = { ...current };
      for (const line of priceChanges) next[line.item.product.id] ??= line.seenPrice;
      return next;
    });
    // на сторінці кошика нові ціни показано — вважаємо їх баченими
    acceptPrices();
  }, [priceChanges, acceptPrices]);

  const canShop = useCanShop();

  // сюди повертає оформлення, якщо товар зник або закінчився (А4)
  const cameFromCheckout = (location.state as { blocked?: boolean } | null)?.blocked === true;

  if (!canShop) {
    return (
      <main className="cart-page">
        <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Кошик' }]} />
        <h2 className="cart-page__title">Кошик</h2>
        <Notice kind="info" title="Кошик доступний покупцям">
          Ви увійшли як адміністратор, а замовлення оформлює Клієнт.{' '}
          <Link to="/admin/orders">Перейти до замовлень магазину</Link>
        </Notice>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="cart-page">
        <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Кошик' }]} />
        <h2 className="cart-page__title">Кошик</h2>
        <ListState kind="empty" text="Кошик порожній. Оберіть товари в каталозі.">
          <Link className="cart-button list-state__retry" to="/catalog">
            До каталогу
          </Link>
        </ListState>
      </main>
    );
  }

  const canCheckout = lines !== null && !hasBlocking && !error;

  return (
    <main className="cart-page">
      <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Кошик' }]} />
      <h2 className="cart-page__title">Кошик</h2>

      {hasBlocking && (
        <Notice kind="warning" title={cameFromCheckout ? 'Замовлення не оформлено' : undefined}>
          Деяких товарів більше немає в наявності або вони недоступні. Видаліть позначені позиції,
          щоб оформити замовлення.
        </Notice>
      )}

      {Object.keys(oldPrices).length > 0 && (
        <Notice kind="info">Ціни деяких товарів змінилися — нові ціни вже враховано в сумі.</Notice>
      )}

      {!!error && !lines && <ListState kind="error" error={error} onRetry={recheck} />}

      <ul className={`cart-lines${isChecking ? ' cart-lines--checking' : ''}`} aria-busy={isChecking}>
        {items.map((item) => {
          const line = lines?.find((entry) => entry.item.product.id === item.product.id);
          const blocked = line ? isBlocking(line) : false;
          const price = line?.current?.price ?? item.product.price;
          const oldPrice = oldPrices[item.product.id];

          return (
            <li key={item.product.id} className={`cart-line${blocked ? ' cart-line--blocked' : ''}`}>
              <ProductImage className="cart-line__image" src={item.product.imageUrl} alt="" />

              <div className="cart-line__info">
                <Link className="cart-line__name" to={`/product/${item.product.id}`}>
                  {item.product.name}
                </Link>
                {line?.state === 'unavailable' ? (
                  <span className="availability availability--out">Товар недоступний</span>
                ) : (
                  line?.current && <AvailabilityBadge availability={line.current.availability} />
                )}
                <p className="cart-line__price">
                  {oldPrice !== undefined && oldPrice !== price && (
                    <s className="cart-line__old-price" aria-label={`Стара ціна ${formatPrice(oldPrice)}`}>
                      {formatPrice(oldPrice)}
                    </s>
                  )}{' '}
                  {formatPrice(price)}
                </p>
              </div>

              <div className="cart-line__quantity">
                {blocked ? (
                  <span className="cart-line__excluded">Не враховано в сумі</span>
                ) : (
                  <QuantityPicker
                    value={item.quantity}
                    max={MAX_QUANTITY}
                    onChange={(quantity) => setQuantity(item.product.id, quantity)}
                  />
                )}
              </div>

              <p className="cart-line__sum">{blocked ? '—' : formatPrice(price * item.quantity)}</p>

              <button
                type="button"
                className="cart-line__remove"
                aria-label={`Видалити з кошика: ${item.product.name}`}
                onClick={() => removeFromCart(item.product.id)}
              >
                <i className="ri-delete-bin-line" /> <span className="cart-line__remove-text">Видалити</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cart-page__footer">
        <p className="cart-page__total">
          Разом: <strong>{lines ? formatPrice(total) : '…'}</strong>
        </p>

        {!!error && lines && (
          <p className="cart-page__check-error" role="alert">
            Не вдалося перевірити актуальні ціни.{' '}
            <button type="button" className="link-button" onClick={recheck}>
              Спробувати ще раз
            </button>
          </p>
        )}

        <div className="cart-page__actions">
          <Link className="cart-page__continue" to="/catalog">
            Продовжити покупки
          </Link>
          {canCheckout ? (
            <Link className="cart-button cart-page__checkout" to="/checkout">
              Оформити замовлення
            </Link>
          ) : (
            <button type="button" className="cart-button cart-page__checkout" disabled>
              {lines === null ? 'Перевіряємо кошик…' : 'Оформити замовлення'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
