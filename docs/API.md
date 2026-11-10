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

## Далі

Оформлення замовлення, кабінет клієнта й адмінка — опишемо тут у тому ж форматі, коли до них дійдемо.
