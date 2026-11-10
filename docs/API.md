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

## Далі

Адмінка: товари, категорії з шаблонами характеристик, виробники (UC-ADM-CAT-*), клієнти та імпорт із Катрану — опишемо тут, коли до них дійдемо.
