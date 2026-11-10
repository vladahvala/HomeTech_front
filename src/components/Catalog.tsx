import type { Category, Product } from '../types';
import CategoryMenu from './CategoryMenu';
import ProductCard from './ProductCard';

export default function Catalog({ categories, products }: { categories: Category[]; products: Product[] }) {
  return (
    <div className="catalog" id="catalog">
      <CategoryMenu categories={categories} className="catalog__sidebar" />
      <main className="catalog__products">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </main>
    </div>
  );
}