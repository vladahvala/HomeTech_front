import { useLocation } from 'react-router';
import { catalogService } from '../api';
import Breadcrumbs from '../components/Breadcrumbs';
import CatalogToolbar from '../components/CatalogToolbar';
import ListState from '../components/ListState';
import Pager from '../components/Pager';
import ProductResults from '../components/ProductResults';
import { SEARCH_MAX, SEARCH_MIN } from '../components/SearchBar';
import { useAsync } from '../hooks/useAsync';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toSearchParams } from '../utils/catalogQuery';

/** Результати пошуку за назвою або артикулом у всіх категоріях (UC-CAT-03) */
export default function SearchPage() {
  const location = useLocation();
  const { query, updateFilters } = useCatalogQuery();
  const text = query.search ?? '';
  const isValid = text.length >= SEARCH_MIN && text.length <= SEARCH_MAX;
  const queryKey = toSearchParams(query).toString();

  useDocumentTitle(text ? `Пошук: ${text}` : 'Пошук');

  const products = useAsync(
    () => (isValid ? catalogService.getProducts(query) : Promise.resolve(undefined)),
    [queryKey],
  );

  const page = products.data;
  const totalPages = page ? Math.ceil(page.total / page.pageSize) : 0;
  const hrefFor = (number: number) =>
    `${location.pathname}?${toSearchParams({ ...query, page: number })}#catalog`;

  return (
    <main className="category-page">
      <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Пошук' }]} />
      <h2 className="category-page__title">{text ? `Пошук: «${text}»` : 'Пошук'}</h2>

      {!isValid ? (
        <ListState
          kind="empty"
          text={`Введіть у пошуку від ${SEARCH_MIN} до ${SEARCH_MAX} символів — назву товару або артикул.`}
        />
      ) : (
        <div className="catalog catalog--wide" id="catalog">
          <div className="catalog__main">
            <CatalogToolbar
              total={page?.total}
              sort={query.sort}
              onSortChange={(sort) => updateFilters({ sort })}
            />
            {products.error ? (
              <ListState kind="error" error={products.error} onRetry={products.reload} />
            ) : !page ? (
              <ListState kind="loading" text="Шукаємо…" />
            ) : (
              <ProductResults
                state={{ ...products, data: page }}
                firstPageHref={hrefFor(1)}
                emptyText={`За запитом «${text}» нічого не знайдено. Перевірте написання або спробуйте коротший запит.`}
              />
            )}
            <Pager currentPage={query.page} totalPages={totalPages} hrefFor={hrefFor} />
          </div>
        </div>
      )}
    </main>
  );
}
