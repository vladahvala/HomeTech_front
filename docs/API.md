# API «ДомТех» — чернетка домовленостей фронт ↔ бекенд

Чернетка від фронтенду, щоб узгодити запити. Повний опис за DOC-04 бекенд оформлює в OpenAPI.

## Загальне

- Усі запити йдуть на `/api/...`, дані — JSON.
- Сесія — у cookie з `HttpOnly`, `Secure`, `SameSite=Lax` (SEC-08). Фронт надсилає запити з `credentials: 'include'` і нічого не зберігає сам.
- У режимі розробки Vite проксює `/api` на `http://localhost:3000` (див. `vite.config.ts`), тож CORS не потрібен.

### Формат помилки (однаковий для всіх запитів, DSN-04)

```json
{
  "error": {
    "code": "EMAIL_TAKEN",
    "message": "Цей email уже зареєстровано. Увійдіть або вкажіть інший email.",
    "fields": { "email": "Цей email уже зареєстровано. Увійдіть або вкажіть інший email." }
  }
}
```

- `code` — машинний код, фронт за ним вирішує, що показати.
- `message` — текст для користувача: причина й що зробити (DOC-02).
- `fields` — необов'язково; помилки окремих полів форми.

## Вхід і реєстрація

### Користувач

```json
{
  "id": 2,
  "email": "client@domtech.ua",
  "fullName": "Олена Коваль",
  "phone": "+380671234567",
  "role": "client"
}
```

`role` — `"client"` або `"admin"`.

| Запит | Тіло | Успіх | Помилки |
|---|---|---|---|
| `GET /api/auth/me` | — | `200` користувач | `401` — не увійшов |
| `POST /api/auth/login` | `{ email, password }` | `200` користувач + cookie | `401 INVALID_CREDENTIALS` «Неправильний email або пароль» (без уточнення поля); `403 ACCOUNT_DISABLED`; `429` — 5 невдалих спроб за 15 хв (SEC-04) |
| `POST /api/auth/register` | `{ email, password, fullName, phone }` | `201` користувач + cookie | `400 VALIDATION_ERROR` з `fields`; `409 EMAIL_TAKEN` |
| `POST /api/auth/logout` | — | `204` | — |

- Реєстрація завжди створює роль `client`, навіть якщо в тілі передали щось інше (SEC-02).
- Сесія діє 7 діб (UC-ACC-02).
- Правила перевірки полів — таблиця 3.5 SRS; на фронті вони в `src/validation/rules.ts`.

## Каталог (UC-CAT-01…04)

Віддає лише **видимі** категорії й товари: опубліковані, невидалені, з ціною, у видимій категорії.

| Запит | Відповідь |
|---|---|
| `GET /api/catalog/categories` | `Category[]` — усі видимі категорії обох рівнів |
| `GET /api/catalog/categories/:slug/filters` | `CategoryFilters` — варіанти фільтрів категорії |
| `GET /api/catalog/products?…` | `Page<ProductSummary>` |
| `GET /api/catalog/products/:id` | `ProductDetails`; `404 NOT_FOUND`, якщо товару немає або він прихований |

### Параметри `GET /api/catalog/products`

Ті самі, що в адресі сторінки (`src/utils/catalogQuery.ts`), тож збережене посилання відкриває той самий список.

| Параметр | Приклад | Зміст |
|---|---|---|
| `category` | `kettles` | slug категорії; для батьківської — товари її підкатегорій |
| `q` | `tefal 1,7` | пошук 2–100 символів: кожне слово є в назві **або** артикулі, без урахування регістру |
| `page` | `2` | номер сторінки, за замовчуванням 1; на сторінці 20 товарів |
| `sort` | `price_asc` | `default` (наявність: «В наявності» → «Очікується» → «Немає», далі за назвою), `price_asc`, `price_desc`, `newest` |
| `m` (кілька) | `m=3&m=7` | id виробників |
| `pmin`, `pmax` | `1000` | діапазон ціни, грн |
| `stock` | `1` | лише «В наявності» |
| `c{id}` (кілька) | `c302=Скло&c302=Пластик` | значення характеристики з id 302 |

Різні фільтри поєднуються умовою «і», варіанти одного фільтра — «або» (UC-CAT-02).

### Типи

```ts
Category        { id, name, slug, parentId: number | null, order }
ProductSummary  { id, name, price, availability: 'in_stock' | 'expected' | 'out_of_stock', imageUrl: string | null }
Page<T>         { items: T[], total, page, pageSize }
CategoryFilters {
  manufacturers: { id, name, country }[],      // лише ті, що є в категорії
  priceMin, priceMax,
  characteristics: {                            // лише характеристики з ознакою «фільтр»
    id, name, type: 'number' | 'enum' | 'boolean' | 'text', unit,
    values: string[]                            // наявні значення; числа — '1.7', так/ні — 'true'/'false'
  }[]
}
ProductDetails = ProductSummary & {
  article, warrantyMonths, manufacturer: { id, name, country } | null,
  assemblyCountry, assemblyCity, description, categoryId,
  characteristics: { name, value, unit }[]      // у порядку шаблону категорії, value — уже текстом
}
```

- `imageUrl` — власне фото, інакше фото з прайсу Katran, інакше `null` (фронт покаже заглушку, FUN-10).
- Повний перелік типів — `src/types/index.ts`.

## Кошик і оформлення замовлення (UC-CRT-03, UC-ORD-01)

Кошик живе на пристрої (localStorage), сервер лише звіряє його й створює замовлення.

| Запит | Тіло | Відповідь |
|---|---|---|
| `POST /api/cart/check` | `{ productIds: number[] }` | `{ productId, product: ProductSummary \| null }[]` — `null`, якщо товар видалено чи приховано |
| `POST /api/orders` | `CreateOrderRequest` | `201 Order` |

### `CreateOrderRequest`

```ts
{
  items: { productId, quantity, price }[],   // price — ціна, яку бачив Клієнт
  recipient: { fullName, phone },
  delivery:
    | { method: 'pickup' }
    | { method: 'courier', address, date: 'YYYY-MM-DD', interval: '09-12' | '12-15' | '15-18' | '18-21' }
    | { method: 'nova_poshta', city, branch },
  payment: 'cash_on_receipt' | 'card_on_receipt' | 'cash_on_delivery' | 'invoice',
  comment: string,                            // до 1000 символів, може бути порожнім
  idempotencyKey: string                      // REL-02, див. нижче
}
```

### Що перевіряє сервер (кроки 11–13)

- Користувач увійшов → інакше `401 UNAUTHORIZED`; деактивований → `403 ACCOUNT_DISABLED`; адміністратор → `403 ADMIN_CANNOT_ORDER`.
- Поля — за таблицею 3.5, дата кур'єра — від завтра до +14 днів за київським часом, оплата — за таблицею 3.4 → інакше `400 VALIDATION_ERROR` з `fields` (ключі: `fullName`, `phone`, `address`, `date`, `interval`, `city`, `branch`, `payment`, `comment`).
- Кожен товар видимий, не «Немає», і `price` збігається з поточною ціною → інакше `409 CART_CHANGED` (фронт заново звіряє кошик і показує зміни).
- Сума — за поточними цінами; номер `DT-000001` по порядку; у позиціях зберігаються назва й ціна; перший запис історії `null → new`.
- **`idempotencyKey`**: якщо замовлення з таким ключем у цього користувача вже є — повернути його, не створюючи нового (подвійне натискання, повтор після обриву зв'язку).
- Усе в одній транзакції: при збої не має лишитися частково створеного замовлення (REL-01).

### `Order`

```ts
{
  id, number: 'DT-000001', status: 'new' | 'processing' | 'assembled' | 'shipped' | 'delivered' | 'cancelled',
  createdAt: ISO, items: { productId, name, price, quantity }[], total,
  recipient: { fullName, phone }, delivery, payment, comment: string | null,
  history: { from: OrderStatus | null, to, at: ISO, by: string, note: string | null }[]
}
```

### Користувач

До `User` додано `deliveryAddress: string | null` — адреса за замовчуванням, яку фронт підставляє в оформлення (UC-ACC-04).

## Кабінет клієнта (UC-ORD-02…04, UC-ACC-04, 05)

| Запит | Тіло | Відповідь | Помилки |
|---|---|---|---|
| `GET /api/orders/my?page=1` | — | `Page<OrderListItem>` від нових до старих, по 20 | `401` |
| `GET /api/orders/my/:number` | — | `Order` | `404 NOT_FOUND` — і для неіснуючого, і для **чужого** замовлення (SEC-05) |
| `POST /api/orders/my/:number/cancel` | `{ reason: string }` (до 500 символів, може бути порожнім) | `Order` зі статусом `cancelled` | `409 STATUS_CHANGED` — статус уже не «Нове»/«В обробці» (REL-03); `400 VALIDATION_ERROR` |
| `PATCH /api/account/profile` | `{ fullName, phone, deliveryAddress: string \| null }` | `User` | `400 VALIDATION_ERROR` з `fields` |
| `POST /api/account/password` | `{ currentPassword, newPassword }` | `204` | `400 WRONG_PASSWORD` з `fields.currentPassword`; `400 VALIDATION_ERROR` з `fields.newPassword` |

```ts
OrderListItem { number, createdAt, itemsCount /* сума кількостей */, total, status }
```

- До `Order` додано `paymentStatus: 'unpaid' | 'paid'` — нове замовлення `unpaid`, змінює Адміністратор (UC-ADM-ORD-03), Клієнт бачить.
- Скасування Клієнтом додає в історію `{ from, to: 'cancelled', by: 'Клієнт', note: reason || null }`.
- Профіль: email Клієнт не змінює (це UC-ADM-CLI-03); `deliveryAddress` — порожній рядок означає «немає» (`null`).
- Зміна пароля доступна Клієнту й Адміністратору; після неї сервер завершує **інші** сесії користувача, поточна лишається (UC-ACC-05).

## Адмінка: замовлення (UC-ADM-ORD-01…03)

Усі запити — лише для ролі `admin`: без сесії `401 UNAUTHORIZED`, Клієнту `403 FORBIDDEN` (SEC-03). Роль перевіряється на кожному запиті, не лише на фронті.

| Запит | Тіло | Відповідь | Помилки |
|---|---|---|---|
| `GET /api/admin/orders?status=new&status=processing&from=2026-11-01&to=2026-11-10&customer=коваль&number=DT-00&page=1` | — | `Page<AdminOrderListItem>` від нових до старих, по 20 | `401`, `403` |
| `GET /api/admin/orders/:number` | — | `AdminOrder` | `404 NOT_FOUND` |
| `POST /api/admin/orders/:number/status` | `{ expectedStatus, status, note }` | `AdminOrder` | `409 STATUS_CHANGED`, `409 TRANSITION_NOT_ALLOWED`, `400 VALIDATION_ERROR` з `fields.note` |
| `PATCH /api/admin/orders/:number` | `{ paymentStatus: 'unpaid' \| 'paid', internalNote }` | `AdminOrder` | `400 VALIDATION_ERROR` з `fields.internalNote` |

Параметри списку (усі необов'язкові):
- `status` — можна повторювати кілька разів; немає — усі статуси;
- `from`, `to` — `YYYY-MM-DD`, включно, дата оформлення **за київським часом**;
- `customer` — підрядок у ПІБ, email чи телефоні Клієнта (або ПІБ отримувача), без урахування регістру;
- `number` — підрядок номера (`DT-00001` знайде `DT-000010…19`).

```ts
OrderCustomer { id, fullName, email, phone }
AdminOrderListItem extends OrderListItem { customer: OrderCustomer, paymentStatus, delivery: 'pickup' | 'courier' | 'nova_poshta' }
AdminOrder extends Order {
  customer: OrderCustomer,
  internalNote: string | null,      // бачить лише Адміністратор
  allowedTransitions: OrderStatus[] // куди можна перевести зараз; [] для кінцевих
}
```

### Зміна статусу

- `expectedStatus` — статус, який Адміністратор бачив на екрані. Якщо зараз інший (хтось змінив раніше, Клієнт скасував) — `409 STATUS_CHANGED`, нічого не змінюється (REL-03). Фронт показує повідомлення й перезавантажує замовлення.
- Перехід перевіряється за таблицею 3.3 (FUN-02); недозволений — `409 TRANSITION_NOT_ALLOWED`:

| Із | До | Хто | Умова |
|---|---|---|---|
| Нове | В обробці | Адміністратор | — |
| Нове | Скасоване | Клієнт, Адміністратор | — |
| В обробці | Зібране | Адміністратор | — |
| В обробці | Скасоване | Клієнт, Адміністратор | — |
| Зібране | Відправлене | Адміністратор | кур'єр або Нова пошта |
| Зібране | Поставлене | Адміністратор | самовивіз |
| Відправлене | Поставлене | Адміністратор | — |

- `note` — до 500 символів; для скасування обов'язкова, мінімум 3 символи (причина).
- Новий статус і запис історії `{ from, to, at, by: <ПІБ адміністратора>, note: note || null }` зберігаються в одній транзакції (FUN-05).
- Ту саму таблицю фронт має в `src/utils/orderTransitions.ts`, але покладається на `allowedTransitions` із відповіді.

### Оплата й службова примітка

- `paymentStatus` — Адміністратор відмічає оплату вручну (рахунок, оплата при отриманні); Клієнт бачить статус оплати у своєму замовленні.
- `internalNote` — до 1000 символів, порожній рядок означає `null`. Клієнту **не** віддається.

### Що бачить Клієнт

У відповідях `/api/orders/my…` історія містить статуси, дати й примітки, але не те, хто саме з персоналу змінив статус (FUN-05). Фронт клієнта поле `by` не показує; бекенд може його не віддавати або віддавати узагальнено («Магазин» / «Клієнт»).

## Адмінка: товари (UC-ADM-PRD-01…05)

Лише для ролі `admin` (`401` / `403`, як у замовленнях). Закупівельну ціну й код постачальника віддаємо тільки тут — у каталозі покупця їх немає (SEC-06).

| Запит | Тіло | Відповідь | Помилки |
|---|---|---|---|
| `GET /api/admin/products?search=чайник&category=3&manufacturer=7&published=false&availability=in_stock&source=katran&page=1` | — | `Page<AdminProductListItem>` — невидалені, **нещодавно змінені першими**, по 20 | — |
| `GET /api/admin/products/:id` | — | `AdminProduct` | `404` (зокрема видалений) |
| `POST /api/admin/products` | `ProductInput` | `AdminProduct` | `400 VALIDATION_ERROR` з `fields` |
| `PUT /api/admin/products/:id` | `ProductInput` | `AdminProduct` | `400 VALIDATION_ERROR`, `404` |
| `PATCH /api/admin/products/:id/publication` | `{ published: boolean }` | `AdminProduct` | `400 CANNOT_PUBLISH` — бракує категорії чи ціни, у `message` сказано чого |
| `DELETE /api/admin/products/:id` | — | `204` | `404` |
| `POST /api/admin/products/:id/photo` | `multipart/form-data`, поле `photo` | `AdminProduct` | `400 INVALID_PHOTO` — не JPEG/PNG/WebP або > 5 МБ |
| `DELETE /api/admin/products/:id/photo` | — | `AdminProduct` (власне фото прибрано) | `404` |

Параметри списку (усі необов'язкові):
- `search` — кожне слово в назві, артикулі або коді постачальника, без урахування регістру;
- `category` — id категорії (з її підкатегоріями) або `none` — товари без категорії;
- `manufacturer` — id; `published` — `true`/`false`; `availability` — `in_stock`/`expected`/`out_of_stock`;
- `source` — `katran` (є код постачальника) або `manual`.

```ts
AdminProductListItem {
  id, name, article: string | null, supplierCode: string | null, source: 'katran' | 'manual',
  categoryId: number | null, categoryName: string | null, manufacturerName: string | null,
  price: number | null, purchasePrice: number | null, availability, published: boolean,
  imageUrl: string | null /* власне, інакше з прайсу */, updatedAt: ISO
}
AdminProduct {
  id, name, availability, categoryId: number | null, manufacturer: Manufacturer | null,
  article, price, purchasePrice, warrantyMonths: number | null, description,
  assemblyCountry, assemblyCity, values: Record<characteristicId, number | string | boolean>,
  published, source, supplierCode, ownImageUrl: string | null, supplierImageUrl: string | null,
  createdAt, updatedAt
}
ProductInput {
  name /* 3–200 */, availability, categoryId: number | null,
  manufacturerName: string /* '' — без виробника; нова назва — новий виробник */,
  article: string, price: number | null /* 0,01–9 999 999,99 */, warrantyMonths: number | null /* 0–120 */,
  description /* до 5000 */, assemblyCountry, assemblyCity,
  values: Record<characteristicId, number | string | boolean>
}
```

Правила:
- **Створення вручну**: без коду постачальника; товар з категорією й ціною одразу `published: true`, інакше прихований.
- **Категорія** — лише без підкатегорій, інакше `fields.categoryId`. Значення характеристик приймаються тільки з шаблону обраної категорії; під час зміни категорії значення попередньої видаляються.
- **Значення**: `number` — число, `boolean` — `true`/`false`, `enum` — один з `options`, `text` — до 200 символів. Помилки — у `fields["value-<id>"]`. Характеристики необов'язкові.
- **Виробник** шукається за назвою без урахування регістру; якщо такого немає — створюється з `country: null`.
- Якщо після редагування в товару немає категорії чи ціни — `published` стає `false`.
- **Видалення** — позначка `deleted`: товар зникає з каталогу, пошуку, цього списку; позиції замовлень зберігаються; імпорт його пропускає (FUN-08). У звірці кошика такий товар — `product: null`.
- **Фото**: показується власне, інакше з прайсу, інакше заглушка (FUN-10). Імпорт оновлює лише фото з прайсу.
- Для товару з прайсу імпорт оновлює ціну, закупівельну ціну, наявність, гарантію й фото з прайсу; решту полів (зокрема змінені Адміністратором) зберігає.

## Адмінка: категорії й шаблони (UC-ADM-CTG-01, 02)

| Запит | Тіло | Відповідь | Помилки |
|---|---|---|---|
| `GET /api/admin/categories` | — | `AdminCategory[]` — усі, з прихованими | — |
| `POST /api/admin/categories` | `CategoryInput` | `AdminCategory` | `400 VALIDATION_ERROR`, `409 NAME_TAKEN` (`fields.name`), `409 SLUG_TAKEN` (`fields.slug`) |
| `PUT /api/admin/categories/:id` | `CategoryInput` | `AdminCategory` | ті самі, `404` |
| `DELETE /api/admin/categories/:id` | — | `204` | `409 CATEGORY_NOT_EMPTY` — є товари або підкатегорії |
| `GET /api/admin/categories/:id/characteristics` | — | `Characteristic[]` за `order` | `404` |
| `POST /api/admin/categories/:id/characteristics` | `CharacteristicInput` | `Characteristic` | `400 VALIDATION_ERROR` (зокрема в категорії є підкатегорії), `409 NAME_TAKEN` |
| `PUT /api/admin/characteristics/:id` | `CharacteristicInput` | `Characteristic` | `409 TYPE_LOCKED` (`fields.type`), `409 OPTION_IN_USE` (`fields.options`), `409 NAME_TAKEN` |
| `DELETE /api/admin/characteristics/:id` | — | `204` — разом зі значеннями в товарах | `404` |

```ts
AdminCategory extends Category { hidden: boolean, importTemplate: string | null, productsCount, childrenCount }
CategoryInput { name /* 2–60, унікальна без регістру */, slug /* a-z, 0-9, дефіс; 2–60; унікальний */,
                parentId: number | null, order /* 0–9999 */, hidden, importTemplate: string | null /* до 200 */ }
Characteristic { id, categoryId, name, type: 'number' | 'enum' | 'boolean' | 'text', unit: string | null,
                 isFilter, order, options: string[], valuesCount /* товарів зі значенням */ }
CharacteristicInput { name /* до 60, унікальна в категорії */, type, unit /* до 20 */, isFilter, order,
                      options: string[] /* для enum 2–30 різних, інакше [] */ }
```

Правила категорій:
- **Два рівні**: батьківська — лише верхнього рівня; категорія з підкатегоріями не може стати дочірньою (`fields.parentId`).
- Товари й шаблон — тільки в категорій без підкатегорій, тому підкатегорію не додають до категорії, де вже є товари (`fields.parentId`).
- **Прихована** категорія прибирає з каталогу себе, свої підкатегорії й товари, але їхні `published` не змінює.
- `importTemplate` — регулярний вираз для початку назви товару в прайсі, без урахування регістру (`(Електро)?чайник`); сервер перевіряє, що вираз правильний (`fields.importTemplate`). За ним імпорт кладе новий товар у категорію прихованим (UC-IMP-01).
- Після будь-якої зміни каталог покупця (меню, фільтри, форма товару) бачить новий стан з наступного запиту (SUP-02).

Правила шаблону:
- Тип характеристики, що має значення в товарах, не змінюється — лише видаленням і створенням заново (`TYPE_LOCKED`).
- Варіант переліку, який мають товари, прибрати не можна (`OPTION_IN_USE`).
- Перед видаленням фронт показує `valuesCount`; видалення прибирає значення з усіх товарів.

## Адмінка: виробники (UC-ADM-MNF-01)

| Запит | Тіло | Відповідь | Помилки |
|---|---|---|---|
| `GET /api/admin/manufacturers` | — | `AdminManufacturer[]` за назвою | — |
| `PUT /api/admin/manufacturers/:id` | `{ name /* 1–100 */, country: string \| null /* до 60 */ }` | `AdminManufacturer` | `400 VALIDATION_ERROR`, `409 NAME_TAKEN` (`fields.name`) — назва іншого виробника без урахування регістру, `404` |

```ts
AdminManufacturer extends Manufacturer { productsCount }
```

Нових виробників створюють імпорт і форма товару (`manufacturerName`).

## Адмінка: клієнти (UC-ADM-CLI-01…04)

Лише для ролі `admin`. Дії стосуються тільки облікових записів з роллю «Клієнт»: на id Адміністратора — `404` (SEC-07).

| Запит | Тіло | Відповідь | Помилки |
|---|---|---|---|
| `GET /api/admin/clients?search=коваль&status=active&page=1` | — | `Page<AdminClientListItem>` — новіші першими, по 20 | — |
| `GET /api/admin/clients/:id` | — | `AdminClient` | `404` |
| `POST /api/admin/clients` | `ClientInput` | `{ client: AdminClient, temporaryPassword: string }` | `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN` (`fields.email`) |
| `PUT /api/admin/clients/:id` | `ClientInput` | `AdminClient` | ті самі, `404` |
| `POST /api/admin/clients/:id/password-reset` | — | `{ temporaryPassword: string }` | `404` |
| `DELETE /api/admin/clients/:id` | — | `204` | `404` |
| `POST /api/admin/clients/:id/restore` | — | `AdminClient` | `404` |

- `search` — частина ПІБ або email без урахування регістру, або цифри телефону (`067 123` знайде `+380671234567`); `status` — `active` (за замовчуванням) або `deleted`.

```ts
AdminClientListItem { id, fullName, email, phone, registeredAt: ISO, ordersCount, isActive }
AdminClient extends AdminClientListItem { deliveryAddress: string | null, orders: OrderListItem[] /* усі, новіші першими */ }
ClientInput { email, fullName, phone /* 0XXXXXXXXX → +380XXXXXXXXX */, deliveryAddress: string | null }
```

- **Тимчасовий пароль** — 12 символів (літери й цифри, щонайменше одна літера й одна цифра), зберігається як bcrypt-хеш і повертається **лише в цій відповіді**. Клієнт змінює його в UC-ACC-05.
- **Скидання пароля** завершує всі сесії Клієнта.
- **Email** унікальний без урахування регістру серед усіх облікових записів (зокрема видалених).
- Зміна контактів **не** змінює вже оформлених замовлень — вони зберігають `recipient` з моменту оформлення.
- **Видалення** — деактивація (FUN-08): вхід відхиляється (`403 ACCOUNT_DISABLED`), поточна сесія перестає діяти з наступного запиту (SEC-03), замовлення зберігаються. `restore` повертає доступ.

## Адмінка: імпорт прайсу Katran (UC-IMP-01)

| Запит | Тіло | Відповідь | Помилки |
|---|---|---|---|
| `GET /api/admin/import/last` | — | `ImportReport` або `204`, якщо імпорту ще не було | — |
| `POST /api/admin/import` | `multipart/form-data`, поле `file` | `ImportReport` | `400 INVALID_FILE`, `409 IMPORT_IN_PROGRESS` |

```ts
ImportReport {
  fileName, startedAt: ISO, finishedAt: ISO,
  added, updated, skipped, errors /* рядків з помилками */, outOfStock /* переведено в «Немає» */,
  errorRows: { row: number /* 1 — заголовок */, message: string }[] /* перші 50 */
}
```

**Формат файлу** (A4 SRS): CSV або ZIP з одним CSV, до 20 МБ; Windows-1251; роздільник `;`; десятковий роздільник — кома; ціна `7,00` означає «ціни немає». Демо-розбір на фронті (`src/api/mock/katranPrice.ts`) очікує колонки *Код, Артикул, Найменування, Виробник, РРЦ, Роздріб, Вхід, Наявність, Гарантія, Фото* — **перевірте назви з реальним файлом Katran** і за потреби поправте обидва боки. Приклад — `public/katran-sample.csv`.

`INVALID_FILE` — не CSV/ZIP, більше 20 МБ, в архіві не рівно один CSV, немає колонок коду й назви.

**Правила:**
- **Наявний код** (не видалений) — оновлює `price`, `purchasePrice`, `availability`, `warrantyMonths`, `supplierImageUrl`; решту полів не чіпає.
- **Новий код** — шукає категорію без підкатегорій, `importTemplate` якої збігається з **початком** назви (регулярний вираз, без урахування регістру); створює товар з `published: false`. Нового виробника створює за назвою. Немає категорії — товар пропускається.
- **Ціна** — РРЦ, якщо > 0 і ≠ 7,00, інакше роздрібна за тією самою умовою, інакше `null`.
- Товари з `supplierCode`, яких немає у файлі, — `availability: 'out_of_stock'`.
- **Пропускаються**: видалені товари, уцінені й вживані (у назві «уцінка», «б/в», «вживаний»), товари без відповідної категорії.
- **Рядок з помилкою** (немає коду чи назви, ціна не число, гарантія не ціле 0–120, незрозуміла наявність, код повторюється) — не імпортується, потрапляє в `errorRows`.
- Імпорт **атомарний** (REL-01): при збої каталог лишається як до початку. Одночасно лише один імпорт (REL-04). Прайс на 7 938 рядків — не довше 120 с (PRF-04).
