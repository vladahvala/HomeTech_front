import About from '../components/About';
import Catalog from '../components/Catalog';
import Pager from '../components/Pager';
import Slider from '../components/Slider';
import { categories } from '../data/categories';
import { products } from '../data/products';
import { advantages } from '../data/site';
import { slides } from '../data/slides';
import { usePagination } from '../hooks/usePagination';

const PRODUCTS_PER_PAGE = 12;

export default function HomePage() {
  const { page, totalPages, pageItems, goToPage } = usePagination(products, PRODUCTS_PER_PAGE);

  return (
    <div className="page">
      <Slider slides={slides} />
      <Catalog categories={categories} products={pageItems} />
      <section className="under-section">
        <Pager currentPage={page} totalPages={totalPages} onPageChange={goToPage} />
        <hr className="under-section__line" />
        <About advantages={advantages} />
      </section>
    </div>
  );
}