import { useLocation } from 'react-router';
import { catalogService } from '../api';
import About from '../components/About';
import CatalogToolbar from '../components/CatalogToolbar';
import CategoryMenu from '../components/CategoryMenu';
import ListState from '../components/ListState';
import Pager from '../components/Pager';
import ProductResults from '../components/ProductResults';
import Slider from '../components/Slider';
import { advantages } from '../data/site';
import { slides } from '../data/slides';
import { useAsync } from '../hooks/useAsync';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { useCategories } from '../hooks/useCategories';
import { toSearchParams } from '../utils/catalogQuery';

export default function HomePage() {
  const location = useLocation();
  const categories = useCategories();
  const { query, updateFilters } = useCatalogQuery();
  const queryKey = toSearchParams(query).toString();
  const products = useAsync(() => catalogService.getProducts(query), [queryKey]);

  const totalPages = products.data ? Math.ceil(products.data.total / products.data.pageSize) : 0;
  const hrefFor = (page: number) =>
    `${location.pathname}?${toSearchParams({ ...query, page })}#catalog`;

  return (
    <div className="page">
      <Slider slides={slides} />

      <div className="catalog" id="catalog">
        <div className="catalog__sidebar">
          {categories.data && <CategoryMenu categories={categories.data} />}
          {categories.isLoading && <ListState kind="loading" text="Завантажуємо категорії…" />}
          {!!categories.error && (
            <ListState kind="error" error={categories.error} onRetry={categories.reload} />
          )}
        </div>

        <div className="catalog__main">
          <CatalogToolbar
            total={products.data?.total}
            sort={query.sort}
            onSortChange={(sort) => updateFilters({ sort })}
          />
          <ProductResults
            state={products}
            emptyText="У каталозі поки немає товарів."
            firstPageHref={hrefFor(1)}
          />
        </div>
      </div>

      <section className="under-section">
        <Pager currentPage={query.page} totalPages={totalPages} hrefFor={hrefFor} />
        <hr className="under-section__line" />
        <About advantages={advantages} />
      </section>
    </div>
  );
}
