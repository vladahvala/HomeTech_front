import type { Slide } from '../types';
import { products } from './products';

// ті самі 6 фото, що й у перших шести товарах
export const slides: Slide[] = [
  { id: 1, image: products[0].image, alt: 'Смартфон Apple iPhone' },
  { id: 2, image: products[1].image, alt: 'Ноутбук ASUS' },
  { id: 3, image: products[2].image, alt: 'Навушники Sony' },
  { id: 4, image: products[3].image, alt: 'Смартгодинник Samsung' },
  { id: 5, image: products[4].image, alt: 'Навушники JBL' },
  { id: 6, image: products[5].image, alt: 'Монітор Samsung' },
];