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

// ===== Замовлення (UC-ORD-01) =====

export type DeliveryMethod = 'pickup' | 'courier' | 'nova_poshta';

export type PaymentMethod = 'cash_on_receipt' | 'card_on_receipt' | 'cash_on_delivery' | 'invoice';

/** Інтервали доставки кур'єром (FUN-06) */
export type DeliveryInterval = '09-12' | '12-15' | '15-18' | '18-21';

/** Статуси й дозволені переходи — таблиця 3.3 */
export type OrderStatus = 'new' | 'processing' | 'assembled' | 'shipped' | 'delivered' | 'cancelled';

/** Статус оплати: «Не оплачено» (початковий) або «Оплачено»; встановлює Адміністратор */
export type PaymentStatus = 'unpaid' | 'paid';

export type DeliveryInfo =
  | { method: 'pickup' }
  | { method: 'courier'; address: string; date: string; interval: DeliveryInterval }
  | { method: 'nova_poshta'; city: string; branch: string };

/** Позиція замовлення: назва й ціна зафіксовані на момент оформлення (FUN-04) */
export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderStatusChange {
  from: OrderStatus | null;
  to: OrderStatus;
  /** ISO-дата */
  at: string;
  /** Хто змінив: «Клієнт», «Адміністратор» або ПІБ */
  by: string;
  note: string | null;
}

export interface Order {
  id: number;
  /** DT-000001 (FUN-03) */
  number: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  total: number;
  recipient: { fullName: string; phone: string };
  delivery: DeliveryInfo;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  comment: string | null;
  history: OrderStatusChange[];
}

/** Рядок архіву замовлень (UC-ORD-02) */
export interface OrderListItem {
  number: string;
  createdAt: string;
  /** Скільки одиниць товару в замовленні */
  itemsCount: number;
  total: number;
  status: OrderStatus;
}

export interface CreateOrderRequest {
  /** price — ціна, яку бачив Клієнт; сервер звіряє її з поточною (крок 11) */
  items: { productId: number; quantity: number; price: number }[];
  recipient: { fullName: string; phone: string };
  delivery: DeliveryInfo;
  payment: PaymentMethod;
  comment: string;
  /** Той самий ключ для повторного підтвердження — сервер поверне вже створене замовлення (REL-02) */
  idempotencyKey: string;
}

/** Відповідь звірки кошика: поточні дані товару або null, якщо товар видалено чи приховано */
export interface CartCheckLine {
  productId: number;
  product: ProductSummary | null;
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
  /** Адреса доставки за замовчуванням — підставляється в оформлення (UC-ACC-04) */
  deliveryAddress: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

// ===== Адмінка: замовлення (UC-ADM-ORD-01…03) =====

export interface OrderCustomer {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

/** Рядок списку замовлень магазину */
export interface AdminOrderListItem extends OrderListItem {
  customer: OrderCustomer;
  paymentStatus: PaymentStatus;
  delivery: DeliveryMethod;
}

/** Замовлення для адміністратора: плюс клієнт, службова примітка й дозволені переходи */
export interface AdminOrder extends Order {
  customer: OrderCustomer;
  /** Бачить лише Адміністратор (UC-ADM-ORD-03) */
  internalNote: string | null;
  /** Куди можна перевести зараз (таблиця 3.3); порожньо для кінцевих статусів */
  allowedTransitions: OrderStatus[];
}

/** Фільтри списку замовлень; живуть в адресі сторінки */
export interface AdminOrderQuery {
  statuses: OrderStatus[];
  /** Період оформлення, 'YYYY-MM-DD' включно */
  dateFrom?: string;
  dateTo?: string;
  /** ПІБ, email або телефон клієнта — частина тексту */
  customer?: string;
  /** Номер замовлення або його частина */
  number?: string;
  page: number;
}

export interface StatusChangeRequest {
  /** Статус, який бачив Адміністратор, — щоб не перезаписати чужу зміну (А2, REL-03) */
  expectedStatus: OrderStatus;
  status: OrderStatus;
  /** До 500 символів; для «Скасоване» — обов'язкова, від 3 символів */
  note: string;
}

export interface PaymentUpdateRequest {
  paymentStatus: PaymentStatus;
  /** До 1000 символів */
  internalNote: string;
}

/** Що Клієнт змінює в профілі (UC-ACC-04); email змінює лише Адміністратор */
export interface ProfileData {
  fullName: string;
  phone: string;
  deliveryAddress: string | null;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

// ===== Адмінка: каталог (UC-ADM-PRD-01…05, UC-ADM-CTG-01, 02, UC-ADM-MNF-01) =====

/** Звідки товар: прайс Katran (має код постачальника) або доданий вручну */
export type ProductSource = 'katran' | 'manual';

/** Значення характеристики товару: число, варіант переліку, так/ні або текст */
export type CharacteristicValue = string | number | boolean;

/** Категорія для адміністратора — разом із прихованими */
export interface AdminCategory extends Category {
  hidden: boolean;
  /** Слова, з яких починається назва товару в прайсі, через кому (UC-IMP-01) */
  importTemplate: string | null;
  /** Невидалені товари саме цієї категорії */
  productsCount: number;
  childrenCount: number;
}

export interface CategoryInput {
  name: string;
  slug: string;
  parentId: number | null;
  order: number;
  hidden: boolean;
  importTemplate: string | null;
}

/** Характеристика з шаблону категорії (UC-ADM-CTG-02) */
export interface Characteristic {
  id: number;
  categoryId: number;
  name: string;
  type: CharacteristicType;
  unit: string | null;
  isFilter: boolean;
  order: number;
  /** Варіанти для переліку (2–30); для інших типів — порожньо */
  options: string[];
  /** Скільки товарів мають значення — тип такої характеристики не змінюють */
  valuesCount: number;
}

export interface CharacteristicInput {
  name: string;
  type: CharacteristicType;
  unit: string | null;
  isFilter: boolean;
  order: number;
  options: string[];
}

export interface AdminManufacturer extends Manufacturer {
  productsCount: number;
}

export interface ManufacturerInput {
  name: string;
  country: string | null;
}

/** Рядок списку товарів в адмінці; закупівельна ціна й код — лише для адміністратора (SEC-06) */
export interface AdminProductListItem {
  id: number;
  name: string;
  article: string | null;
  supplierCode: string | null;
  source: ProductSource;
  categoryId: number | null;
  categoryName: string | null;
  manufacturerName: string | null;
  price: number | null;
  purchasePrice: number | null;
  availability: Availability;
  published: boolean;
  imageUrl: string | null;
  updatedAt: string;
}

/** Фільтри списку товарів; живуть в адресі сторінки */
export interface AdminProductQuery {
  /** Назва, артикул або код постачальника */
  search?: string;
  /** id категорії або 'none' — товари без категорії */
  category?: number | 'none';
  manufacturer?: number;
  published?: boolean;
  availability?: Availability;
  source?: ProductSource;
  page: number;
}

/** Товар для форми редагування */
export interface AdminProduct {
  id: number;
  name: string;
  availability: Availability;
  categoryId: number | null;
  manufacturer: Manufacturer | null;
  article: string | null;
  price: number | null;
  purchasePrice: number | null;
  warrantyMonths: number | null;
  description: string;
  assemblyCountry: string | null;
  assemblyCity: string | null;
  /** id характеристики → значення */
  values: Record<number, CharacteristicValue>;
  published: boolean;
  source: ProductSource;
  supplierCode: string | null;
  /** Власне фото важливіше за фото з прайсу (FUN-10) */
  ownImageUrl: string | null;
  supplierImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Що Адміністратор вводить у формі товару (UC-ADM-PRD-02, 03) */
export interface ProductInput {
  name: string;
  availability: Availability;
  categoryId: number | null;
  /** Назва виробника; нова назва створює нового виробника, порожньо — без виробника */
  manufacturerName: string;
  article: string;
  price: number | null;
  warrantyMonths: number | null;
  description: string;
  assemblyCountry: string;
  assemblyCity: string;
  values: Record<number, CharacteristicValue>;
}
