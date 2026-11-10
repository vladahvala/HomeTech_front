import type { Product } from '../types';

const UNSPLASH = 'https://images.unsplash.com/';

const img = (id: string) => `${UNSPLASH}${id}?auto=format&fit=crop&w=600&q=80`;

// Поки немає справжніх фото з різних ракурсів, галерея показує
// наближені фрагменти того самого фото. Замініть на реальні, коли будуть.
const zoom = (id: string, x: number, y: number) =>
  `${UNSPLASH}${id}?auto=format&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=2&w=600&h=600&q=80`;

const gallery = (id: string) => [img(id), zoom(id, 0.35, 0.4), zoom(id, 0.5, 0.5), zoom(id, 0.65, 0.6)];

export const products: Product[] = [
  {
    id: 1,
    title: 'Смартфон Apple iPhone 17 Pro Max 256GB Deep Blue',
    price: 59999,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrAdLtNlQJrGychv2kUtwr05vT79vwPJ1XFNozaK5iBg&s=10',
    imageAlt: 'Смартфон Apple iPhone',
    description:
      'Флагманський смартфон Apple з великим екраном, потужною камерою та 256 ГБ пам’яті для фото, відео й застосунків.',
  },
  {
    id: 2,
    title: 'Ноутбук ASUS Vivobook 15 X1504VA 15.6" Intel Core i5',
    price: 29999,
    image: img('photo-1496181133206-80ce9b88a853'),
    imageAlt: 'Ноутбук ASUS Vivobook',
    gallery: gallery('photo-1496181133206-80ce9b88a853'),
    description:
      'Ноутбук з екраном 15,6" і процесором Intel Core i5 для навчання, роботи з документами та повсякденних завдань.',
  },
  {
    id: 3,
    title: 'Навушники Sony WH-1000XM5 Black, бездротові',
    price: 12499,
    oldPrice: 14999,
    image: img('photo-1505740420928-5e560c06d30e'),
    imageAlt: 'Навушники Sony',
    gallery: gallery('photo-1505740420928-5e560c06d30e'),
    description:
      'Повнорозмірні бездротові навушники Sony з активним шумозаглушенням — для дороги, роботи та музики.',
  },
  {
    id: 4,
    title: 'Смартгодинник Samsung Galaxy Watch8 44mm Silver',
    price: 12999,
    image: img('photo-1523275335684-37898b6baf30'),
    imageAlt: 'Смартгодинник Samsung',
    gallery: gallery('photo-1523275335684-37898b6baf30'),
    description: 'Смартгодинник Samsung з корпусом 44 мм: сповіщення, відстеження активності та сну.',
  },
  {
    id: 5,
    title: 'Навушники JBL Tune 520BT Black, Bluetooth',
    price: 1899,
    oldPrice: 2299,
    image: img('photo-1583394838336-acd977736f90'),
    imageAlt: 'Навушники JBL',
    gallery: gallery('photo-1583394838336-acd977736f90'),
    description: 'Легкі накладні Bluetooth-навушники JBL для щоденного використання.',
  },
  {
    id: 6,
    title: 'Монітор Samsung 24" Full HD IPS 100Hz',
    price: 4999,
    image: img('photo-1498049794561-7780e7231661'),
    imageAlt: 'Монітор Samsung',
    gallery: gallery('photo-1498049794561-7780e7231661'),
    description: 'Монітор 24" з IPS-матрицею, роздільністю Full HD і частотою оновлення 100 Гц.',
  },
  {
    id: 7,
    title: 'Смартгодинник Apple Watch Series 11 GPS 42mm',
    price: 19999,
    image: img('photo-1546868871-7041f2a55e12'),
    imageAlt: 'Смартгодинник Apple Watch',
    gallery: gallery('photo-1546868871-7041f2a55e12'),
    description: 'Смартгодинник Apple з GPS і корпусом 42 мм — працює в парі з iPhone.',
  },
  {
    id: 8,
    title: 'Смартфон Samsung Galaxy A56 5G 256GB Awesome Graphite',
    price: 17999,
    image: img('photo-1598327105666-5b89351aff97'),
    imageAlt: 'Смартфон Samsung Galaxy',
    gallery: gallery('photo-1598327105666-5b89351aff97'),
    description: 'Смартфон Samsung з підтримкою 5G і 256 ГБ вбудованої пам’яті.',
  },
];

export function getProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id);
}