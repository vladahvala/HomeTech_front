import type { Slide } from '../types';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;

export const slides: Slide[] = [
  {
    id: 1,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrAdLtNlQJrGychv2kUtwr05vT79vwPJ1XFNozaK5iBg&s=10',
    alt: 'Смартфон Apple iPhone',
  },
  { id: 2, image: img('photo-1496181133206-80ce9b88a853'), alt: 'Ноутбук ASUS' },
  { id: 3, image: img('photo-1505740420928-5e560c06d30e'), alt: 'Навушники Sony' },
  { id: 4, image: img('photo-1523275335684-37898b6baf30'), alt: 'Смартгодинник Samsung' },
  { id: 5, image: img('photo-1583394838336-acd977736f90'), alt: 'Навушники JBL' },
  { id: 6, image: img('photo-1498049794561-7780e7231661'), alt: 'Монітор Samsung' },
];
