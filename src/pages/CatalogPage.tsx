import { useLocation } from 'react-router';
import { catalogService } from '../api';
import Breadcrumbs from '../components/Breadcrumbs';
import CatalogToolbar from '../components/CatalogToolbar';
import CategoryMenu from '../components/CategoryMenu';
import ListState from '../components/ListState';
import Pager from '../components/Pager';
import ProductResults from '../components/ProductResults';
import { useAsync } from '../hooks/useAsync';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { useCategories } from '../hooks/useCategories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toSearchParams } from '../utils/catalogQuery';

/** Увесь каталог: меню категорій, усі видимі товари, сортування й сторінки (UC-CAT-01) */
export default function CatalogPage() {
  useDocumentTitle('Каталог');
  const location = useLocation();
  const categories = useCategories();
  const { query, updateFilters } = useCatalogQuery();
  const queryKey = toSearchParams(query).toString();
  const products = useAsync(() => catalogService.getProducts(query), [queryKey]);

  const totalPages = products.data ? Math.ceil(products.data.total / products.data.pageSize) : 0;
  const hrefFor = (page: number) =>
    `${location.pathname}?${toSearchParams({ ...query, page })}#catalog`;

  return (
    <main className="category-page catalog-page">
      <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Каталог' }]} />
      <h2 className="category-page__title">Каталог</h2>

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
      </section>
    </main>
  );
}
