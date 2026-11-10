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
import {
  effectivePrice,
  hasActivePromo,
  isCategoryVisible,
  isProductVisible,
  loadCatalog,
  toProductSummary,
} from '../mock/catalogStore';
import type { CatalogState, StoredProduct } from '../mock/catalogStore';
import { PAGE_SIZE, PROMOTIONS_LIMIT } from './CatalogService';
import type { CatalogService } from './CatalogService';

// ТИМЧАСОВО, поки немає бекенду. Правила відбору й сортування — як у SRS,
// щоб справжній бекенд поводився так само (UC-CAT-01…03). Покупець бачить
// лише видимі категорії й товари — що змінила адмінка, видно з наступного запиту.

type MockProduct = StoredProduct;

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const AVAILABILITY_ORDER: Record<Availability, number> = { in_stock: 0, expected: 1, out_of_stock: 2 };
const byName = (a: MockProduct, b: MockProduct) => a.name.localeCompare(b.name, 'uk');
// фільтр і сортування — за ціною, яку покупець платить зараз (під час акції — акційною)
const priceOf = (product: MockProduct) => effectivePrice(product);

const notFound = (what: string) =>
  new ApiError(404, 'NOT_FOUND', `${what} не знайдено. Перевірте адресу або поверніться до каталогу.`);

export class MockCatalogService implements CatalogService {
  async getCategories(): Promise<Category[]> {
    await delay(150);
    const state = loadCatalog();
    return state.categories
      .filter((category) => isCategoryVisible(state, category.id))
      .map(({ id, name, slug, parentId, order }) => ({ id, name, slug, parentId, order }));
  }

  async getFilters(categorySlug: string): Promise<CategoryFilters> {
    await delay();
    const state = loadCatalog();
    const category = this.findCategory(state, categorySlug);
    const ids = this.categoryIds(state, category);
    const products = this.visibleProducts(state).filter(
      (product) => product.categoryId !== null && ids.includes(product.categoryId),
    );

    const manufacturerIds = new Set(products.map((product) => product.manufacturerId));
    const manufacturers = state.manufacturers.filter((item) => manufacturerIds.has(item.id)).sort((a, b) =>
      a.name.localeCompare(b.name, 'uk'),
    );

    const prices = products.map(priceOf);

    const characteristics: CharacteristicFilter[] = state.characteristics.filter(
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
    const state = loadCatalog();
    let list = this.visibleProducts(state);

    if (query.category) {
      const ids = this.categoryIds(state, this.findCategory(state, query.category));
      list = list.filter((product) => product.categoryId !== null && ids.includes(product.categoryId));
    }

    // кожне слово запиту — у назві або артикулі, без урахування регістру (UC-CAT-03)
    if (query.search) {
      const words = query.search.toLocaleLowerCase('uk').split(/\s+/).filter(Boolean);
      list = list.filter((product) => {
        const haystack = `${product.name} ${product.article ?? ''}`.toLocaleLowerCase('uk');
        return words.every((word) => haystack.includes(word));
      });
    }

    // фільтри поєднуються умовою «і», варіанти одного фільтра — «або» (UC-CAT-02)
    if (query.manufacturers.length) {
      list = list.filter((product) => product.manufacturerId !== null && query.manufacturers.includes(product.manufacturerId));
    }
    const { priceMin, priceMax } = query;
    if (priceMin !== undefined) list = list.filter((product) => priceOf(product) >= priceMin);
    if (priceMax !== undefined) list = list.filter((product) => priceOf(product) <= priceMax);
    if (query.inStockOnly) list = list.filter((product) => product.availability === 'in_stock');
    if (query.promoOnly) list = list.filter(hasActivePromo);

    for (const [id, values] of Object.entries(query.characteristics)) {
      if (!values.length) continue;
      list = list.filter((product) => values.includes(String(product.values[Number(id)])));
    }

    list.sort(this.comparator(query.sort));

    const start = (query.page - 1) * PAGE_SIZE;
    return {
      items: list.slice(start, start + PAGE_SIZE).map(toProductSummary),
      total: list.length,
      page: query.page,
      pageSize: PAGE_SIZE,
    };
  }

  async getPromotions(): Promise<ProductSummary[]> {
    await delay(200);
    const state = loadCatalog();
    // видимі товари з діючою акцією: спершу більша знижка
    return this.visibleProducts(state)
      .filter(hasActivePromo)
      .map(toProductSummary)
      .sort((a, b) => b.oldPrice! / b.price - a.oldPrice! / a.price || a.name.localeCompare(b.name, 'uk'))
      .slice(0, PROMOTIONS_LIMIT);
  }

  async getProduct(id: number): Promise<ProductDetails> {
    await delay();
    const state = loadCatalog();
    // прихований, видалений або без категорії — для покупця «не знайдено»
    const product = state.products.find((item) => item.id === id);
    if (!product || !isProductVisible(state, product) || product.categoryId === null) throw notFound('Товар');

    const characteristics = state.characteristics.filter((item) => item.categoryId === product.categoryId)
      .sort((a, b) => a.order - b.order)
      .filter((item) => product.values[item.id] !== undefined)
      .map((item) => ({
        name: item.name,
        value: formatCharacteristicValue(String(product.values[item.id]), item.type, null),
        unit: item.unit,
      }));

    return {
      ...toProductSummary(product),
      article: product.article,
      warrantyMonths: product.warrantyMonths,
      manufacturer: state.manufacturers.find((item) => item.id === product.manufacturerId) ?? null,
      assemblyCountry: product.assemblyCountry,
      assemblyCity: product.assemblyCity,
      description: product.description,
      categoryId: product.categoryId,
      characteristics,
    };
  }

  private visibleProducts(state: CatalogState): MockProduct[] {
    return state.products.filter((product) => isProductVisible(state, product));
  }

  private findCategory(state: CatalogState, slug: string): Category {
    const category = state.categories.find((item) => item.slug === slug);
    if (!category || !isCategoryVisible(state, category.id)) throw notFound('Категорію');
    return category;
  }

  /** Категорія разом із підкатегоріями */
  private categoryIds(state: CatalogState, category: Category): number[] {
    return [
      category.id,
      ...state.categories.filter((item) => item.parentId === category.id).map((item) => item.id),
    ];
  }

  private comparator(sort: ProductQuery['sort']) {
    switch (sort) {
      case 'price_asc':
        return (a: MockProduct, b: MockProduct) => priceOf(a) - priceOf(b) || byName(a, b);
      case 'price_desc':
        return (a: MockProduct, b: MockProduct) => priceOf(b) - priceOf(a) || byName(a, b);
      case 'newest':
        return (a: MockProduct, b: MockProduct) =>
          b.createdAt.localeCompare(a.createdAt) || b.id - a.id;
      default:
        // спершу «В наявності», потім «Очікується», потім «Немає»; усередині — за назвою (UC-CAT-01)
        return (a: MockProduct, b: MockProduct) =>
          AVAILABILITY_ORDER[a.availability] - AVAILABILITY_ORDER[b.availability] || byName(a, b);
    }
  }
}
