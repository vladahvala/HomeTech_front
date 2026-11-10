import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { formatPrice } from '../utils/format';

/** Іконка кошика в меню з лічильником і випадаючим списком товарів */
export default function CartWidget() {
  const { items, totalCount, totalPrice, removeFromCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(cartRef, close, isOpen);

  // Esc закриває кошик
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <div className="cart" ref={cartRef}>
      <button
        type="button"
        className="cart__toggle"
        aria-label={`Кошик, товарів: ${totalCount}`}
        aria-expanded={isOpen}
        aria-controls="cart-box"
        onClick={() => setIsOpen((value) => !value)}
      >
        <i className="ri-shopping-cart-line" />
        {totalCount > 0 && <span className="cart__badge">{totalCount}</span>}
      </button>

      {isOpen && (
        <div className="cart__box" id="cart-box">
          <p className="cart__title">Кошик</p>

          {items.length === 0 ? (
            <p className="cart__empty">Ваш кошик порожній</p>
          ) : (
            <>
              <ul className="cart__list">
                {items.map(({ product, quantity }) => (
                  <li key={product.id} className="cart__item">
                    <img className="cart__image" src={product.image} alt="" />

                    <div className="cart__details">
                      <Link to={`/product/${product.id}`} className="cart__name" onClick={close}>
                        {product.title}
                      </Link>
                      <p className="cart__price">
                        {formatPrice(product.price)} × {quantity} ={' '}
                        <strong>{formatPrice(product.price * quantity)}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      className="cart__remove"
                      aria-label={`Видалити з кошика: ${product.title}`}
                      onClick={() => removeFromCart(product.id)}
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </li>
                ))}
              </ul>

              <p className="cart__total">
                Разом: <strong>{formatPrice(totalPrice)}</strong>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}