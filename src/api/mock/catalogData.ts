// ТИМЧАСОВІ стартові дані каталогу, поки немає бекенду. Адмінка змінює їхню
// копію в localStorage (див. catalogStore.ts), тут — лише початковий стан.
// Категорії — стартові з UC-SYS-02; щоб показати два рівні, «Чайники» й
// «Мікрохвильові печі» вкладено в «Кухонна техніка». Фото немає — у прайсі
// Katran вони будуть, а поки показується заглушка (FUN-10).

import type { Availability, Category, CharacteristicType, CharacteristicValue, Manufacturer } from '../../types';

export interface MockCharacteristic {
  id: number;
  categoryId: number;
  name: string;
  type: CharacteristicType;
  unit: string | null;
  isFilter: boolean;
  order: number;
}

export interface MockProduct {
  id: number;
  categoryId: number;
  manufacturerId: number;
  name: string;
  price: number;
  availability: Availability;
  article: string;
  warrantyMonths: number;
  assemblyCountry: string;
  assemblyCity: string | null;
  description: string;
  createdAt: string;
  imageUrl: string | null;
  values: Record<number, CharacteristicValue>;
}

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Холодильники', slug: 'fridges', parentId: null, order: 1 },
  { id: 2, name: 'Кухонна техніка', slug: 'kitchen', parentId: null, order: 2 },
  { id: 3, name: 'Чайники', slug: 'kettles', parentId: 2, order: 1 },
  { id: 4, name: 'Мікрохвильові печі', slug: 'microwaves', parentId: 2, order: 2 },
  { id: 5, name: 'Витяжки', slug: 'hoods', parentId: null, order: 3 },
  { id: 6, name: 'Пилососи', slug: 'vacuums', parentId: null, order: 4 },
];

export const MANUFACTURERS: Manufacturer[] = [
  { id: 1, name: 'Bosch', country: 'Німеччина' },
  { id: 2, name: 'Samsung', country: 'Південна Корея' },
  { id: 3, name: 'LG', country: 'Південна Корея' },
  { id: 4, name: 'Gorenje', country: 'Словенія' },
  { id: 5, name: 'Electrolux', country: 'Швеція' },
  { id: 6, name: 'Philips', country: 'Нідерланди' },
  { id: 7, name: 'Tefal', country: 'Франція' },
  { id: 8, name: 'Xiaomi', country: 'Китай' },
  { id: 9, name: 'Pyramida', country: 'Україна' },
  { id: 10, name: 'Whirlpool', country: 'США' },
  { id: 11, name: 'Ardesto', country: 'Україна' },
];

export const CHARACTERISTICS: MockCharacteristic[] = [
  // Холодильники
  { id: 101, categoryId: 1, name: 'Загальний об’єм', type: 'number', unit: 'л', isFilter: true, order: 1 },
  { id: 102, categoryId: 1, name: 'No Frost', type: 'boolean', unit: null, isFilter: true, order: 2 },
  { id: 103, categoryId: 1, name: 'Клас енергоспоживання', type: 'enum', unit: null, isFilter: true, order: 3 },
  { id: 104, categoryId: 1, name: 'Колір', type: 'enum', unit: null, isFilter: true, order: 4 },
  { id: 105, categoryId: 1, name: 'Висота', type: 'number', unit: 'см', isFilter: false, order: 5 },
  // Чайники
  { id: 301, categoryId: 3, name: 'Об’єм', type: 'number', unit: 'л', isFilter: true, order: 1 },
  { id: 302, categoryId: 3, name: 'Матеріал корпусу', type: 'enum', unit: null, isFilter: true, order: 2 },
  { id: 303, categoryId: 3, name: 'Регулювання температури', type: 'boolean', unit: null, isFilter: true, order: 3 },
  { id: 304, categoryId: 3, name: 'Потужність', type: 'number', unit: 'Вт', isFilter: false, order: 4 },
  // Мікрохвильові печі
  { id: 401, categoryId: 4, name: 'Об’єм', type: 'number', unit: 'л', isFilter: true, order: 1 },
  { id: 402, categoryId: 4, name: 'Гриль', type: 'boolean', unit: null, isFilter: true, order: 2 },
  { id: 403, categoryId: 4, name: 'Тип управління', type: 'enum', unit: null, isFilter: true, order: 3 },
  { id: 404, categoryId: 4, name: 'Потужність мікрохвиль', type: 'number', unit: 'Вт', isFilter: false, order: 4 },
  // Витяжки
  { id: 501, categoryId: 5, name: 'Тип', type: 'enum', unit: null, isFilter: true, order: 1 },
  { id: 502, categoryId: 5, name: 'Ширина', type: 'number', unit: 'см', isFilter: true, order: 2 },
  { id: 503, categoryId: 5, name: 'Продуктивність', type: 'number', unit: 'м³/год', isFilter: false, order: 3 },
  { id: 504, categoryId: 5, name: 'Колір', type: 'enum', unit: null, isFilter: true, order: 4 },
  // Пилососи
  { id: 601, categoryId: 6, name: 'Тип', type: 'enum', unit: null, isFilter: true, order: 1 },
  { id: 602, categoryId: 6, name: 'Вологе прибирання', type: 'boolean', unit: null, isFilter: true, order: 2 },
  { id: 603, categoryId: 6, name: 'Потужність всмоктування', type: 'number', unit: 'Вт', isFilter: false, order: 3 },
];

// ----- Генерація товарів -----

type Row = [
  manufacturerId: number,
  model: string,
  price: number,
  availability: Availability,
  values: Record<number, CharacteristicValue>,
];

const COUNTRY_OF: Record<number, [string, string | null]> = {
  1: ['Німеччина', 'Мюнхен'],
  2: ['Південна Корея', 'Сувон'],
  3: ['Польща', 'Вроцлав'],
  4: ['Словенія', 'Веленє'],
  5: ['Польща', 'Олава'],
  6: ['Китай', 'Чжухай'],
  7: ['Китай', 'Шеньчжень'],
  8: ['Китай', 'Пекін'],
  9: ['Україна', 'Київ'],
  10: ['Польща', 'Вроцлав'],
  11: ['Китай', 'Нінбо'],
};

const brand = (id: number) => MANUFACTURERS.find((item) => item.id === id)?.name ?? '';
const litres = (value: number) => value.toLocaleString('uk-UA');

let nextId = 1;

function build(
  categoryId: number,
  rows: Row[],
  title: (row: Row) => string,
  describe: (row: Row) => string,
  warrantyMonths: number,
): MockProduct[] {
  return rows.map((row, index) => {
    const [manufacturerId, model, price, availability, values] = row;
    const [assemblyCountry, assemblyCity] = COUNTRY_OF[manufacturerId];
    const id = nextId++;
    return {
      id,
      categoryId,
      manufacturerId,
      name: title(row),
      price,
      availability,
      article: model,
      warrantyMonths,
      assemblyCountry,
      assemblyCity,
      description: describe(row),
      // новіші товари мають більший номер — для сортування «новіші першими»
      createdAt: new Date(Date.UTC(2026, 9, 1 + ((index * 7 + categoryId * 3) % 40))).toISOString(),
      imageUrl: null,
      values,
    };
  });
}

const fridges = build(
  1,
  [
    [2, 'RB38T600FSA', 27999, 'in_stock', { 101: 385, 102: true, 103: 'A++', 104: 'Сріблястий', 105: 203 }],
    [3, 'GA-B509CQSL', 25499, 'in_stock', { 101: 419, 102: true, 103: 'A+', 104: 'Сріблястий', 105: 203 }],
    [1, 'KGN39VWEQ', 29999, 'expected', { 101: 368, 102: true, 103: 'A++', 104: 'Білий', 105: 203 }],
    [4, 'RK4181PW4', 13999, 'in_stock', { 101: 260, 102: false, 103: 'A+', 104: 'Білий', 105: 180 }],
    [5, 'LNT7ME34X2', 31999, 'out_of_stock', { 101: 367, 102: true, 103: 'A+++', 104: 'Сріблястий', 105: 186 }],
    [10, 'W7X 82I K', 22999, 'in_stock', { 101: 338, 102: false, 103: 'A+', 104: 'Сріблястий', 105: 191 }],
    [11, 'DNF-M295X188', 15999, 'in_stock', { 101: 295, 102: true, 103: 'A+', 104: 'Чорний', 105: 188 }],
    [2, 'RB34T670EBN', 26499, 'expected', { 101: 344, 102: true, 103: 'A+++', 104: 'Чорний', 105: 185 }],
  ],
  ([m, model, , , v]) => `Холодильник ${brand(m)} ${model} ${v[101]} л`,
  ([m, , , , v]) =>
    `Двокамерний холодильник ${brand(m)} загальним об’ємом ${v[101]} л${
      v[102] ? ' із системою No Frost — розморожувати не потрібно' : ''
    }. Клас енергоспоживання ${v[103]}.`,
  24,
);

const kettles = build(
  3,
  [
    [7, 'KO2408', 1199, 'in_stock', { 301: 1.7, 302: 'Пластик', 303: false, 304: 2400 }],
    [6, 'HD9350/90', 1899, 'in_stock', { 301: 1.7, 302: 'Нержавіюча сталь', 303: false, 304: 2200 }],
    [1, 'TWK3A011', 1349, 'in_stock', { 301: 1.7, 302: 'Пластик', 303: false, 304: 2400 }],
    [8, 'Mi Smart Kettle Pro', 1999, 'in_stock', { 301: 1.5, 302: 'Нержавіюча сталь', 303: true, 304: 1800 }],
    [9, 'PK-1703', 749, 'in_stock', { 301: 1.7, 302: 'Пластик', 303: false, 304: 2200 }],
    [7, 'KI700830', 2499, 'expected', { 301: 1.7, 302: 'Нержавіюча сталь', 303: true, 304: 2400 }],
    [6, 'HD9339/80', 1599, 'in_stock', { 301: 1.7, 302: 'Скло', 303: false, 304: 2200 }],
    [1, 'TWK4P440', 2199, 'out_of_stock', { 301: 1.7, 302: 'Нержавіюча сталь', 303: false, 304: 2400 }],
    [5, 'E4K1-6ST', 2799, 'in_stock', { 301: 1.7, 302: 'Нержавіюча сталь', 303: true, 304: 2400 }],
    [11, 'EKL-1617G', 899, 'in_stock', { 301: 1.7, 302: 'Скло', 303: false, 304: 2200 }],
    [8, 'Electric Kettle 2', 1099, 'in_stock', { 301: 1.7, 302: 'Пластик', 303: false, 304: 1800 }],
    [9, 'PK-1580 Glass', 899, 'expected', { 301: 1.8, 302: 'Скло', 303: false, 304: 2200 }],
    [7, 'BF2508', 1399, 'in_stock', { 301: 1, 302: 'Пластик', 303: false, 304: 2400 }],
    [6, 'HD9365/10', 2299, 'in_stock', { 301: 1.7, 302: 'Нержавіюча сталь', 303: false, 304: 2200 }],
    [1, 'TWK7L463', 3199, 'in_stock', { 301: 1.7, 302: 'Нержавіюча сталь', 303: true, 304: 2400 }],
    [5, 'EEWA3330', 1499, 'out_of_stock', { 301: 1.7, 302: 'Пластик', 303: false, 304: 2200 }],
    [11, 'EKL-1210', 649, 'in_stock', { 301: 1.2, 302: 'Пластик', 303: false, 304: 1500 }],
    [8, 'Mi Kettle Lite', 799, 'in_stock', { 301: 1.5, 302: 'Пластик', 303: false, 304: 1800 }],
    [7, 'KO8501', 2899, 'expected', { 301: 1.5, 302: 'Скло', 303: true, 304: 2200 }],
    [9, 'PK-1725 Steel', 999, 'in_stock', { 301: 1.7, 302: 'Нержавіюча сталь', 303: false, 304: 2200 }],
    [6, 'HD4646/70', 1299, 'in_stock', { 301: 1.5, 302: 'Пластик', 303: false, 304: 2400 }],
    [11, 'EKL-2017TS', 1199, 'in_stock', { 301: 1.7, 302: 'Нержавіюча сталь', 303: true, 304: 2200 }],
  ],
  ([m, model, , , v]) => `Електрочайник ${brand(m)} ${model} ${litres(v[301] as number)} л`,
  ([m, , , , v]) =>
    `Електричний чайник ${brand(m)} об’ємом ${litres(v[301] as number)} л, корпус — ${String(
      v[302],
    ).toLowerCase()}${v[303] ? ', з регулюванням температури' : ''}. Потужність ${v[304]} Вт.`,
  12,
);

const microwaves = build(
  4,
  [
    [2, 'MS23K3513AW', 4299, 'in_stock', { 401: 23, 402: false, 403: 'Сенсорне', 404: 800 }],
    [3, 'MH6336GIB', 4999, 'in_stock', { 401: 23, 402: true, 403: 'Сенсорне', 404: 1000 }],
    [4, 'MO17E1W', 2799, 'in_stock', { 401: 17, 402: false, 403: 'Механічне', 404: 700 }],
    [11, 'MWO-20MS', 2399, 'out_of_stock', { 401: 20, 402: false, 403: 'Механічне', 404: 700 }],
    [5, 'EMZ729EMK', 9999, 'expected', { 401: 25, 402: true, 403: 'Сенсорне', 404: 900 }],
    [10, 'MWP 203 W', 5499, 'in_stock', { 401: 20, 402: true, 403: 'Механічне', 404: 700 }],
  ],
  ([m, model, , , v]) => `Мікрохвильова піч ${brand(m)} ${model} ${v[401]} л`,
  ([m, , , , v]) =>
    `Мікрохвильова піч ${brand(m)} об’ємом ${v[401]} л${v[402] ? ' з грилем' : ''}, ${String(
      v[403],
    ).toLowerCase()} управління.`,
  12,
);

const hoods = build(
  5,
  [
    [9, 'HES 30 (60 cm) INOX', 3299, 'in_stock', { 501: 'Купольна', 502: 60, 503: 650, 504: 'Нержавіюча сталь' }],
    [1, 'DWB66DM50', 12999, 'in_stock', { 501: 'Купольна', 502: 60, 503: 590, 504: 'Нержавіюча сталь' }],
    [5, 'LFV316K', 8499, 'expected', { 501: 'Похила', 502: 60, 503: 550, 504: 'Чорний' }],
    [4, 'WHI643E6XGW', 7999, 'in_stock', { 501: 'Похила', 502: 60, 503: 580, 504: 'Білий' }],
    [9, 'MH 50 BL', 2999, 'out_of_stock', { 501: 'Вбудована', 502: 50, 503: 450, 504: 'Чорний' }],
    [11, 'HL-6090B', 4599, 'in_stock', { 501: 'Плоска', 502: 90, 503: 750, 504: 'Чорний' }],
  ],
  ([m, model]) => `Витяжка ${brand(m)} ${model}`,
  ([m, , , , v]) =>
    `${v[501]} кухонна витяжка ${brand(m)} шириною ${v[502]} см, продуктивність ${v[503]} м³/год.`,
  24,
);

const vacuums = build(
  6,
  [
    [8, 'Robot Vacuum S10', 7999, 'in_stock', { 601: 'Робот', 602: true, 603: 45 }],
    [6, 'FC9334/09', 3999, 'in_stock', { 601: 'Контейнерний', 602: false, 603: 370 }],
    [2, 'VS15A6031R1', 11999, 'expected', { 601: 'Акумуляторний', 602: false, 603: 150 }],
    [1, 'BGL3A330', 4499, 'in_stock', { 601: 'Мішковий', 602: false, 603: 390 }],
    [3, 'VK76W02HY', 5299, 'in_stock', { 601: 'Контейнерний', 602: false, 603: 380 }],
    [7, 'TW3927EA', 3299, 'out_of_stock', { 601: 'Контейнерний', 602: false, 603: 250 }],
    [5, 'EP81UB25UG', 9499, 'in_stock', { 601: 'Акумуляторний', 602: true, 603: 120 }],
    [8, 'Mi Vacuum G10', 8999, 'in_stock', { 601: 'Акумуляторний', 602: false, 603: 150 }],
  ],
  ([m, model]) => `Пилосос ${brand(m)} ${model}`,
  ([m, , , , v]) =>
    `${v[601]} пилосос ${brand(m)}${v[602] ? ' з функцією вологого прибирання' : ''}.`,
  24,
);

export const PRODUCTS: MockProduct[] = [...fridges, ...kettles, ...microwaves, ...hoods, ...vacuums];
