import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useTemporaryFlag } from '../hooks/useTemporaryFlag';
import type { Product } from '../types';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [justAdded, showAdded] = useTemporaryFlag();
  const productUrl = `/product/${product.id}`;

  // клік будь-де по картці відкриває товар (крім кнопки та посилання — у них своя дія)
  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest('a, button')) return;
    navigate(productUrl);
  };

  const handleAddToCart = () => {
    addToCart(product);
    showAdded();
  };

  return (
    <article className="product-card" onClick={handleCardClick}>
      <img className="product-card__image" src={product.image} alt={product.imageAlt} />
      <h3 className="product-card__title">
        <Link className="product-card__link" to={productUrl}>
          {product.title}
        </Link>
      </h3>
      <p className="product-card__price">{formatPrice(product.price)}</p>
      <button className="product-card__button cart-button" type="button" onClick={handleAddToCart}>
        <i className={`cart-button__icon ${justAdded ? 'ri-check-line' : 'ri-shopping-cart-line'}`} />{' '}
        {justAdded ? 'Додано в кошик' : 'Додати в кошик'}
      </button>
    </article>
  );
}
