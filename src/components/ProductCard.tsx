import type { Product } from '../types';
import { formatPrice } from '../utils/format';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <img className="product-card__image" src={product.image} alt={product.imageAlt} />
      <h3 className="product-card__title">{product.title}</h3>
      <p className="product-card__price">{formatPrice(product.price)}</p>
      <button className="product-card__button cart-button" type="button">
        <i className="cart-button__icon ri-shopping-cart-line" /> Додати в кошик
      </button>
    </article>
  );
}