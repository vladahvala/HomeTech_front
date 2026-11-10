import type {
  Availability,
  Category,
  CategoryFilters,
  CharacteristicFilter,
  Page,
  ProductDetails,
  ProductQuery,
  ProductSummary,
} from '../../types';
import { formatCharacteristicValue } from '../../utils/labels';
import { ApiError } from '../ApiError';
import { CATEGORIES, CHARACTERISTICS, MANUFACTURERS, PRODUCTS } from '../mock/catalogData';
import type { MockProduct } from '../mock/catalogData';
import { PAGE_SIZE } from './CatalogService';
import type { CatalogService } from './CatalogService';

// ТИМЧАСОВО, поки немає бекенду. Правила відбору й сортування — як у SRS,
// щоб справжній бекенд поводився так само (UC-CAT-01…03).

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const AVAILABILITY_ORDER: Record<Availability, number> = { in_stock: 0, expected: 1, out_of_stock: 2 };
const byName = (a: MockProduct, b: MockProduct) => a.name.localeCompare(b.name, 'uk');

const notFound = (what: string) =>
  new ApiError(404, 'NOT_FOUND', `${what} не знайдено. Перевірте адресу або поверніться до каталогу.`);

export class MockCatalogService implements CatalogService {
  async getCategories(): Promise<Category[]> {
    await delay(150);
    return CATEGORIES.map((category) => ({ ...category }));
  }

  async getFilters(categorySlug: string): Promise<CategoryFilters> {
    await delay();
    const category = this.findCategory(categorySlug);
    const products = PRODUCTS.filter((product) => this.categoryIds(category).includes(product.categoryId));

    const manufacturerIds = new Set(products.map((product) => product.manufacturerId));
    const manufacturers = MANUFACTURERS.filter((item) => manufacturerIds.has(item.id)).sort((a, b) =>
      a.name.localeCompare(b.name, 'uk'),
    );

    const prices = products.map((product) => product.price);

    const characteristics: CharacteristicFilter[] = CHARACTERISTICS.filter(
      (item) => item.categoryId === category.id && item.isFilter,
    )
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const values = [...new Set(products.map((product) => product.values[item.id]))]
          .filter((value) => value !== undefined)
          .map(String);
        if (item.type === 'number') values.sort((a, b) => Number(a) - Number(b));
        else if (item.type === 'boolean') values.sort().reverse(); // спершу «Так»
        else values.sort((a, b) => a.localeCompare(b, 'uk'));
        return { id: item.id, name: item.name, type: item.type, unit: item.unit, values };
      })
      .filter((item) => item.values.length > 0);

    return {
      manufacturers,
      priceMin: prices.length ? Math.min(...prices) : 0,
      priceMax: prices.length ? Math.max(...prices) : 0,
      characteristics,
    };
  }

  async getProducts(query: ProductQuery): Promise<Page<ProductSummary>> {
    await delay();
    let list = [...PRODUCTS];

    if (query.category) {
      const ids = this.categoryIds(this.findCategory(query.category));
      list = list.filter((product) => ids.includes(product.categoryId));
    }

    // кожне слово запиту — у назві або артикулі, без урахування регістру (UC-CAT-03)
    if (query.search) {
      const words = query.search.toLocaleLowerCase('uk').split(/\s+/).filter(Boolean);
      list = list.filter((product) => {
        const haystack = `${product.name} ${product.article}`.toLocaleLowerCase('uk');
        return words.every((word) => haystack.includes(word));
      });
    }

    // фільтри поєднуються умовою «і», варіанти одного фільтра — «або» (UC-CAT-02)
    if (query.manufacturers.length) {
      list = list.filter((product) => query.manufacturers.includes(product.manufacturerId));
    }
    const { priceMin, priceMax } = query;
    if (priceMin !== undefined) list = list.filter((product) => product.price >= priceMin);
    if (priceMax !== undefined) list = list.filter((product) => product.price <= priceMax);
    if (query.inStockOnly) list = list.filter((product) => product.availability === 'in_stock');

    for (const [id, values] of Object.entries(query.characteristics)) {
      if (!values.length) continue;
      list = list.filter((product) => values.includes(String(product.values[Number(id)])));
    }

    list.sort(this.comparator(query.sort));

    const start = (query.page - 1) * PAGE_SIZE;
    return {
      items: list.slice(start, start + PAGE_SIZE).map((product) => this.toSummary(product)),
      total: list.length,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  }

  async getProduct(id: number): Promise<ProductDetails> {
    await delay();
    const product = PRODUCTS.find((item) => item.id === id);
    if (!product) throw notFound('Товар');

    const characteristics = CHARACTERISTICS.filter((item) => item.categoryId === product.categoryId)
      .sort((a, b) => a.order - b.order)
      .filter((item) => product.values[item.id] !== undefined)
      .map((item) => ({
        name: item.name,
        value: formatCharacteristicValue(String(product.values[item.id]), item.type, null),
        unit: item.unit,
      }));

    return {
      ...this.toSummary(product),
      article: product.article,
      warrantyMonths: product.warrantyMonths,
      manufacturer: MANUFACTURERS.find((item) => item.id === product.manufacturerId) ?? null,
      assemblyCountry: product.assemblyCountry,
      assemblyCity: product.assemblyCity,
      description: product.description,
      categoryId: product.categoryId,
      characteristics,
    };
  }

  private findCategory(slug: string): Category {
    const category = CATEGORIES.find((item) => item.slug === slug);
    if (!category) throw notFound('Категорію');
    return category;
  }

  /** Категорія разом із підкатегоріями */
  private categoryIds(category: Category): number[] {
    return [
      category.id,
      ...CATEGORIES.filter((item) => item.parentId === category.id).map((item) => item.id),
    ];
  }

  private comparator(sort: ProductQuery['sort']) {
    switch (sort) {
      case 'price_asc':
        return (a: MockProduct, b: MockProduct) => a.price - b.price || byName(a, b);
      case 'price_desc':
        return (a: MockProduct, b: MockProduct) => b.price - a.price || byName(a, b);
      case 'newest':
        return (a: MockProduct, b: MockProduct) =>
          b.createdAt.localeCompare(a.createdAt) || b.id - a.id;
      default:
        // спершу «В наявності», потім «Очікується», потім «Немає»; усередині — за назвою (UC-CAT-01)
        return (a: MockProduct, b: MockProduct) =>
          AVAILABILITY_ORDER[a.availability] - AVAILABILITY_ORDER[b.availability] || byName(a, b);
    }
  }

  private toSummary(product: MockProduct): ProductSummary {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      availability: product.availability,
      imageUrl: product.imageUrl,
    };
  }
}
