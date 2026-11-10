import { useLocation } from 'react-router';
import { catalogService } from '../api';
import Breadcrumbs from '../components/Breadcrumbs';
import CatalogToolbar from '../components/CatalogToolbar';
import Pager from '../components/Pager';
import ProductResults from '../components/ProductResults';
import { useAsync } from '../hooks/useAsync';
import { useCatalogQuery } from '../hooks/useCatalogQuery';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toSearchParams } from '../utils/catalogQuery';

/** Усі товари з діючою акцією в усіх категоріях */
export default function PromotionsPage() {
  useDocumentTitle('Акції');
  const location = useLocation();
  const { query, updateFilters } = useCatalogQuery();
  // promoOnly не пишемо в адресу — сторінка й так лише про акції
  const products = useAsync(
    () => catalogService.getProducts({ ...query, promoOnly: true }),
    [toSearchParams(query).toString()],
  );

  const totalPages = products.data ? Math.ceil(products.data.total / products.data.pageSize) : 0;
  const hrefFor = (page: number) => `${location.pathname}?${toSearchParams({ ...query, page })}#catalog`;

  return (
    <main className="category-page">
      <Breadcrumbs items={[{ label: 'Головна', to: '/' }, { label: 'Акції' }]} />
      <h2 className="category-page__title">Акції та спеціальні пропозиції</h2>

      <div className="catalog catalog--wide" id="catalog">
        <div className="catalog__main">
          <CatalogToolbar
            total={products.data?.total}
            sort={query.sort}
            onSortChange={(sort) => updateFilters({ sort })}
          />
          <ProductResults
            state={products}
            firstPageHref={hrefFor(1)}
            emptyText="Зараз акцій немає. Загляньте пізніше або перегляньте весь каталог."
          />
          <Pager currentPage={query.page} totalPages={totalPages} hrefFor={hrefFor} />
        </div>
      </div>
    </main>
  );
}
