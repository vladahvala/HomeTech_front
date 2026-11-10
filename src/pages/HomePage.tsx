import { Link } from 'react-router';
import { catalogService } from '../api';
import About from '../components/About';
import ListState from '../components/ListState';
import ProductCard from '../components/ProductCard';
import Slider from '../components/Slider';
import { advantages } from '../data/site';
import { useAsync } from '../hooks/useAsync';
import { getChildren, useCategories } from '../hooks/useCategories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { emptyQuery } from '../utils/catalogQuery';

const NEW_ARRIVALS = 8;

/** Головна: акції, категорії, новинки, коротко про магазин */
export default function HomePage() {
  useDocumentTitle(undefined);
  // карусель — лише для акцій; поки їх немає (або не завантажились), її не показуємо
  const promotions = useAsync(() => catalogService.getPromotions(), []);
  const categories = useCategories();
  const newest = useAsync(() => catalogService.getProducts({ ...emptyQuery(), sort: 'newest' }), []);

  const topLevel = categories.data ? getChildren(categories.data, null) : [];

  return (
    <div className="page home">
      {promotions.data && promotions.data.length > 0 && <Slider products={promotions.data} />}

      <section className="home__section" aria-labelledby="home-categories">
        <div className="home__header">
          <h2 id="home-categories" className="home__title">
            Категорії
          </h2>
          <Link className="home__more" to="/catalog">
            Увесь каталог →
          </Link>
        </div>
        {categories.error ? (
          <ListState kind="error" error={categories.error} onRetry={categories.reload} />
        ) : !categories.data ? (
          <ListState kind="loading" text="Завантажуємо категорії…" />
        ) : topLevel.length === 0 ? (
          <ListState kind="empty" text="Категорій поки немає." />
        ) : (
          <ul className="category-tiles">
            {topLevel.map((category) => {
              const children = getChildren(categories.data!, category.id);
              return (
                <li key={category.id} className="category-tiles__item">
                  <Link className="category-tiles__name" to={`/catalog/${category.slug}`}>
                    {category.name}
                  </Link>
                  {children.length > 0 && (
                    <ul className="category-tiles__children">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link className="category-tiles__child" to={`/catalog/${child.slug}`}>
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="home__section" aria-labelledby="home-new">
        <div className="home__header">
          <h2 id="home-new" className="home__title">
            Новинки
          </h2>
          <Link className="home__more" to="/catalog?sort=newest">
            Усі новинки →
          </Link>
        </div>
        {newest.error ? (
          <ListState kind="error" error={newest.error} onRetry={newest.reload} />
        ) : !newest.data ? (
          <ListState kind="loading" text="Завантажуємо новинки…" />
        ) : newest.data.items.length === 0 ? (
          <ListState kind="empty" text="У каталозі поки немає товарів." />
        ) : (
          <div className="catalog__products home__products">
            {newest.data.items.slice(0, NEW_ARRIVALS).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        <p className="home__cta">
          <Link className="cart-button home__cta-button" to="/catalog">
            Перейти до каталогу
          </Link>
        </p>
      </section>

      <section className="under-section">
        <hr className="under-section__line" />
        <About advantages={advantages} />
      </section>
    </div>
  );
}
