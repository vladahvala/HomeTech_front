import type { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ADD_RESULT_LABELS, useCart } from '../context/CartContext';
import type { AddToCartResult } from '../context/CartContext';
import { useCanShop } from '../hooks/useCanShop';
import { useTemporaryValue } from '../hooks/useTemporaryValue';
import type { ProductSummary } from '../types';
import { formatPrice } from '../utils/format';
import { canOrder } from '../utils/labels';
import AvailabilityBadge from './AvailabilityBadge';
import ProductImage from './ProductImage';

export default function ProductCard({ product }: { product: ProductSummary }) {
  const { addToCart } = useCart();
  const canShop = useCanShop();
  const navigate = useNavigate();
  const [feedback, showFeedback] = useTemporaryValue<AddToCartResult>();
  const productUrl = `/product/${product.id}`;
  const orderable = canOrder(product.availability);

  // клік будь-де по картці відкриває товар (крім кнопки та посилання — у них своя дія)
  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof Element && event.target.closest('a, button')) return;
    navigate(productUrl);
  };

  let buttonText = 'Додати в кошик';
  if (!orderable) buttonText = 'Немає в наявності';
  else if (feedback) buttonText = ADD_RESULT_LABELS[feedback];

  return (
    <article className="product-card" onClick={handleCardClick}>
      <ProductImage className="product-card__image" src={product.imageUrl} alt={product.name} />
      <h3 className="product-card__title">
        <Link className="product-card__link" to={productUrl}>
          {product.name}
        </Link>
      </h3>
      <AvailabilityBadge availability={product.availability} />
      <p className="product-card__price">{formatPrice(product.price)}</p>
      {canShop && (
        <button
          className="product-card__button cart-button"
          type="button"
          disabled={!orderable}
          onClick={() => showFeedback(addToCart(product))}
        >
          <i
            className={`cart-button__icon ${
              feedback === 'added' ? 'ri-check-line' : 'ri-shopping-cart-line'
            }`}
          />{' '}
          {buttonText}
        </button>
      )}
    </article>
  );
}
