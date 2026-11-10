import { Link, useLocation, useParams } from 'react-router';
import { catalogService } from '../api';
import Breadcrumbs from '../components/Breadcrumbs';
import CatalogFilters from '../components/CatalogFilters';
import CatalogToolbar from '../components/CatalogToolbar';
import ListState from '../components/ListState';
import Pager from '../components/Pager';
import ProductResults from '../components/ProductResults';
import { useAsync } from '../hooks/useAsync';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { getCategoryPath, getChildren, useCategories } from '../hooks/useCategories';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import type { Category } from '../types';
import { hasActiveFilters, toSearchParams } from '../utils/catalogQuery';
import NotFoundPage from './NotFoundPage';

/** Сторінка категорії: підкатегорії або товари з фільтрами (UC-CAT-01, UC-CAT-02) */
export default function CategoryPage() {
  const { slug } = useParams();
  const { data: categories, error, isLoading, reload } = useCategories();
  const category = categories?.find((item) => item.slug === slug);
  useDocumentTitle(category?.name);

  if (error) return <ListState kind="error" error={error} onRetry={reload} />;
  if (isLoading || !categories) return <ListState kind="loading" />;
  if (!category) return <NotFoundPage message="Такої категорії немає" />;

  const crumbs = [
    { label: 'Головна', to: '/' },
    ...getCategoryPath(categories, category.id).map((item) => ({
      label: item.name,
      to: item.id === category.id ? undefined : `/catalog/${item.slug}`,
    })),
  ];
  const children = getChildren(categories, category.id);

  return (
    <main className="category-page">
      <Breadcrumbs items={crumbs} />
      <h2 className="category-page__title">{category.name}</h2>

      {children.length > 0 ? (
        <ul className="subcategories">
          {children.map((child) => (
            <li key={child.id}>
              <Link className="subcategories__link" to={`/catalog/${child.slug}`}>
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        // key: при переході в іншу категорію фільтри починаються з нуля
        <CategoryProducts key={category.slug} category={category} />
      )}
    </main>
  );
}

function CategoryProducts({ category }: { category: Category }) {
  const location = useLocation();
  const { query, setQuery, updateFilters } = useCatalogQuery(category.slug);
  const queryKey = toSearchParams(query).toString();

  const filters = useAsync(() => catalogService.getFilters(category.slug), [category.slug]);
  const products = useAsync(() => catalogService.getProducts(query), [category.slug, queryKey]);

  const totalPages = products.data ? Math.ceil(products.data.total / products.data.pageSize) : 0;
  const hrefFor = (page: number) =>
    `${location.pathname}?${toSearchParams({ ...query, page })}#catalog`;

  const filtered = hasActiveFilters(query);
  const resetFilters = () =>
    setQuery({
      ...query,
      page: 1,
      manufacturers: [],
      priceMin: undefined,
      priceMax: undefined,
      inStockOnly: false,
      characteristics: {},
    });

  return (
    <div className="catalog" id="catalog">
      <div className="catalog__sidebar">
        {filters.data && <CatalogFilters filters={filters.data} query={query} onChange={updateFilters} />}
        {!!filters.error && <ListState kind="error" error={filters.error} onRetry={filters.reload} />}
      </div>

      <div className="catalog__main">
        <CatalogToolbar
          total={products.data?.total}
          sort={query.sort}
          onSortChange={(sort) => updateFilters({ sort })}
        />
        <ProductResults
          state={products}
          firstPageHref={hrefFor(1)}
          emptyText={
            filtered
              ? 'Немає товарів, що відповідають усім фільтрам. Спробуйте прибрати частину з них.'
              : 'У цій категорії поки немає товарів.'
          }
          emptyAction={
            filtered && (
              <button type="button" className="cart-button" onClick={resetFilters}>
                Скинути фільтри
              </button>
            )
          }
        />
        <Pager currentPage={query.page} totalPages={totalPages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
