import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { catalogService } from '../api';
import { ApiError } from '../api/ApiError';
import AvailabilityBadge from '../components/AvailabilityBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import ListState from '../components/ListState';
import ProductGallery from '../components/ProductGallery';
import QuantityPicker from '../components/QuantityPicker';
import { ADD_RESULT_LABELS, MAX_QUANTITY, useCart } from '../context/CartContext';
import type { AddToCartResult } from '../context/CartContext';
import { useAsync } from '../hooks/useAsync';
import { getCategoryPath, useCategories } from '../hooks/useCategories';
import { useCanShop } from '../hooks/useCanShop';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTemporaryValue } from '../hooks/useTemporaryValue';
import type { ProductDetails } from '../types';
import { formatPrice } from '../utils/format';
import { canOrder, formatWarranty } from '../utils/labels';
import NotFoundPage from './NotFoundPage';

/** Картка товару (UC-CAT-04) */
export default function ProductPage() {
  const id = Number(useParams().id);
  const { data: product, error, isLoading, reload } = useAsync(() => catalogService.getProduct(id), [id]);
  useDocumentTitle(product?.name);

  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundPage message="Такого товару не знайдено" />;
  }
  if (error) return <ListState kind="error" error={error} onRetry={reload} />;
  if (isLoading || !product || product.id !== id) return <ListState kind="loading" />;

  // key скидає кількість при переході на інший товар
  return <ProductDetailsView key={product.id} product={product} />;
}

function ProductDetailsView({ product }: { product: ProductDetails }) {
  const { addToCart, buyNow } = useCart();
  const canShop = useCanShop();
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const [quantity, setQuantity] = useState(1);
  const [feedback, showFeedback] = useTemporaryValue<AddToCartResult>(2500);
  const orderable = canOrder(product.availability);

  // UC-CRT-02: додаємо, якщо товару ще немає в кошику, і переходимо до оформлення
  const handleBuy = () => {
    const result = buyNow(product, quantity);
    if (result === 'added' || result === 'already_in_cart') navigate('/checkout');
    else showFeedback(result);
  };

  const crumbs = [
    { label: 'Головна', to: '/' },
    ...getCategoryPath(categories ?? [], product.categoryId).map((item) => ({
      label: item.name,
      to: `/catalog/${item.slug}`,
    })),
    { label: product.name },
  ];

  // загальні відомості — лише ті, що заповнені
  const facts: [string, string][] = [];
  if (product.manufacturer) {
    facts.push(['Виробник', product.manufacturer.name]);
    if (product.manufacturer.country) facts.push(['Країна виробника', product.manufacturer.country]);
  }
  if (product.assemblyCountry) {
    const place = [product.assemblyCountry, product.assemblyCity].filter(Boolean).join(', ');
    facts.push(['Країна й місто збирання', place]);
  }
  if (product.warrantyMonths !== null) facts.push(['Гарантія', formatWarranty(product.warrantyMonths)]);
  if (product.article) facts.push(['Артикул', product.article]);

  return (
    <main className="product-page">
      <Breadcrumbs items={crumbs} />

      <div className="product-page__layout">
        <ProductGallery images={product.imageUrl ? [product.imageUrl] : []} alt={product.name} />

        <section className="product-page__info">
          <h2 className="product-page__title">{product.name}</h2>

          <div className="product-page__prices">
            <span className="product-page__price">{formatPrice(product.price)}</span>
            <AvailabilityBadge availability={product.availability} />
          </div>

          {!canShop ? (
            <p className="product-page__admin-note">
              Ви переглядаєте товар як адміністратор — кошик і замовлення доступні покупцям.
            </p>
          ) : orderable ? (
            <div className="product-page__buy">
              <QuantityPicker value={quantity} onChange={setQuantity} max={MAX_QUANTITY} />
              <button
                className="cart-button product-page__add"
                type="button"
                onClick={() => showFeedback(addToCart(product, quantity))}
              >
                <i className="cart-button__icon ri-shopping-cart-line" /> Додати в кошик
              </button>
              <button className="buy-button product-page__buy-now" type="button" onClick={handleBuy}>
                Купити
              </button>
            </div>
          ) : (
            <p className="product-page__unavailable">
              Товару немає в наявності, тому замовити його зараз не можна.
            </p>
          )}

          {canShop && orderable && quantity > 1 && (
            <p className="product-page__sum">Разом: {formatPrice(product.price * quantity)}</p>
          )}

          <p
            className={`product-page__status${feedback && feedback !== 'added' ? ' product-page__status--error' : ''}`}
            role="status"
          >
            {feedback === 'added' ? 'Товар додано в кошик' : feedback ? ADD_RESULT_LABELS[feedback] : ''}
          </p>

          {facts.length > 0 && (
            <dl className="specs">
              {facts.map(([name, value]) => (
                <div key={name} className="specs__row">
                  <dt className="specs__name">{name}</dt>
                  <dd className="specs__value">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      {product.characteristics.length > 0 && (
        <section className="product-page__section">
          <h3 className="product-page__subtitle">Характеристики</h3>
          <dl className="specs specs--wide">
            {product.characteristics.map((item) => (
              <div key={item.name} className="specs__row">
                <dt className="specs__name">{item.name}</dt>
                <dd className="specs__value">{item.unit ? `${item.value} ${item.unit}` : item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {product.description && (
        <section className="product-page__section">
          <h3 className="product-page__subtitle">Опис</h3>
          <p className="product-page__description">{product.description}</p>
        </section>
      )}
    </main>
  );
}
