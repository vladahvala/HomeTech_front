import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import ProductGallery from '../components/ProductGallery';
import QuantityPicker from '../components/QuantityPicker';
import { MAX_QUANTITY, useCart } from '../context/CartContext';
import { getProductById } from '../data/products';
import { SITE_NAME, SITE_TITLE } from '../data/site';
import { useTemporaryFlag } from '../hooks/useTemporaryFlag';
import type { Product } from '../types';
import { formatPrice } from '../utils/format';
import NotFoundPage from './NotFoundPage';

export default function ProductPage() {
  const { id } = useParams();
  const product = getProductById(Number(id));

  if (!product) {
    return <NotFoundPage message="Такого товару не знайдено" />;
  }

  // key скидає галерею й кількість при переході на інший товар
  return <ProductDetails key={product.id} product={product} />;
}

function getDiscount(product: Product): number {
  if (product.oldPrice === undefined || product.oldPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.oldPrice) * 100);
}

function ProductDetails({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, showAdded] = useTemporaryFlag(2500);

  useEffect(() => {
    document.title = `${product.title} — ${SITE_NAME}`;
    return () => {
      document.title = SITE_TITLE;
    };
  }, [product.title]);

  const images = product.gallery?.length ? product.gallery : [product.image];
  const discount = getDiscount(product);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    showAdded();
  };

  return (
    <main className="product-page">
      <nav className="breadcrumbs" aria-label="Ви тут">
        <Link className="breadcrumbs__link" to="/">
          Головна
        </Link>
        <span className="breadcrumbs__separator">/</span>
        <Link className="breadcrumbs__link" to="/#catalog">
          Каталог
        </Link>
        <span className="breadcrumbs__separator">/</span>
        <span className="breadcrumbs__current">{product.title}</span>
      </nav>

      <div className="product-page__layout">
        <ProductGallery images={images} alt={product.imageAlt} />

        <section className="product-page__info">
          <h2 className="product-page__title">{product.title}</h2>

          <div className="product-page__prices">
            <span className="product-page__price">{formatPrice(product.price)}</span>
            {discount > 0 && product.oldPrice !== undefined && (
              <>
                <span className="product-page__discount">−{discount}%</span>
                <span className="product-page__old-price">{formatPrice(product.oldPrice)}</span>
              </>
            )}
          </div>

          <p className="product-page__description">{product.description}</p>

          <div className="product-page__buy">
            <QuantityPicker value={quantity} onChange={setQuantity} max={MAX_QUANTITY} />

            <button className="cart-button product-page__add" type="button" onClick={handleAddToCart}>
              <i className="cart-button__icon ri-shopping-cart-line" /> Додати в кошик
            </button>
          </div>

          {quantity > 1 && (
            <p className="product-page__sum">Разом: {formatPrice(product.price * quantity)}</p>
          )}

          <p className="product-page__status" role="status">
            {justAdded ? 'Товар додано в кошик' : ''}
          </p>
        </section>
      </div>
    </main>
  );
}
