// ===== Загальне =====

export interface NavLink {
  href: string;
  label: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export interface Slide {
  id: number;
  image: string;
  alt: string;
}

/** Сторінка списку з сервера: товари 21–40 із 137 тощо */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ===== Каталог (SRS: UC-CAT-01…04) =====

/** Статус наявності. Замовити можна «В наявності» і «Очікується» (FUN-07) */
export type Availability = 'in_stock' | 'expected' | 'out_of_stock';

/** Категорія; parentId = null — верхній рівень (усього два рівні, UC-ADM-CTG-01) */
export interface Category {
  id: number;
  name: string;
  /** Ідентифікатор в адресі сторінки: /catalog/kettles */
  slug: string;
  parentId: number | null;
  order: number;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: string | null;
}

export type CharacteristicType = 'number' | 'enum' | 'boolean' | 'text';

/** Фільтр за характеристикою з шаблону категорії */
export interface CharacteristicFilter {
  id: number;
  name: string;
  type: CharacteristicType;
  unit: string | null;
  /** Значення, які є у видимих товарах категорії (для boolean — 'true'/'false') */
  values: string[];
}

/** Що можна відфільтрувати в категорії */
export interface CategoryFilters {
  manufacturers: Manufacturer[];
  priceMin: number;
  priceMax: number;
  characteristics: CharacteristicFilter[];
}

/** Товар у списку */
export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  availability: Availability;
  /** Власне фото, інакше фото з прайсу Katran; null — показуємо заглушку (FUN-10) */
  imageUrl: string | null;
}

/** Характеристика на картці товару — уже в порядку шаблону категорії */
export interface ProductCharacteristic {
  name: string;
  value: string;
  unit: string | null;
}

/** Повні дані товару для картки (UC-CAT-04) */
export interface ProductDetails extends ProductSummary {
  article: string | null;
  warrantyMonths: number | null;
  manufacturer: Manufacturer | null;
  assemblyCountry: string | null;
  assemblyCity: string | null;
  description: string;
  categoryId: number;
  characteristics: ProductCharacteristic[];
}

export type SortOrder = 'default' | 'price_asc' | 'price_desc' | 'newest';

/** Параметри списку товарів; ті самі живуть в адресі сторінки (UC-CAT-02) */
export interface ProductQuery {
  /** slug категорії; без нього — усі видимі товари */
  category?: string;
  /** Пошуковий запит, 2–100 символів (UC-CAT-03) */
  search?: string;
  page: number;
  sort: SortOrder;
  manufacturers: number[];
  priceMin?: number;
  priceMax?: number;
  inStockOnly: boolean;
  /** id характеристики → обрані значення (у межах одного фільтра — «або») */
  characteristics: Record<number, string[]>;
}

// ===== Кошик =====

/** Позиція кошика; дані товару — знімок на момент додавання (звірка з сервером — етап 2.2) */
export interface CartItem {
  product: ProductSummary;
  quantity: number;
}

// ===== Користувачі =====

/** Ролі за SRS: «Клієнт» і «Адміністратор». Гість — це просто відсутність входу */
export type UserRole = 'client' | 'admin';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}
