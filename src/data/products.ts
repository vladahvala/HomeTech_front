import type { Product } from '../types';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;

export const products: Product[] = [
  { id: 1, title: 'Смартфон Apple iPhone 17 Pro Max 256GB Deep Blue', price: 59999,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQrAdLtNlQJrGychv2kUtwr05vT79vwPJ1XFNozaK5iBg&s=10',
    imageAlt: 'Смартфон Apple iPhone' },
  { id: 2, title: 'Ноутбук ASUS Vivobook 15 X1504VA 15.6" Intel Core i5', price: 29999,
    image: img('photo-1496181133206-80ce9b88a853'), imageAlt: 'Ноутбук ASUS Vivobook' },
  { id: 3, title: 'Навушники Sony WH-1000XM5 Black, бездротові', price: 12499,
    image: img('photo-1505740420928-5e560c06d30e'), imageAlt: 'Навушники Sony' },
  { id: 4, title: 'Смартгодинник Samsung Galaxy Watch8 44mm Silver', price: 12999,
    image: img('photo-1523275335684-37898b6baf30'), imageAlt: 'Смартгодинник Samsung' },
  { id: 5, title: 'Навушники JBL Tune 520BT Black, Bluetooth', price: 1899,
    image: img('photo-1583394838336-acd977736f90'), imageAlt: 'Навушники JBL' },
  { id: 6, title: 'Монітор Samsung 24" Full HD IPS 100Hz', price: 4999,
    image: img('photo-1498049794561-7780e7231661'), imageAlt: 'Монітор Samsung' },
  { id: 7, title: 'Смартгодинник Apple Watch Series 11 GPS 42mm', price: 19999,
    image: img('photo-1546868871-7041f2a55e12'), imageAlt: 'Смартгодинник Apple Watch' },
  { id: 8, title: 'Смартфон Samsung Galaxy A56 5G 256GB Awesome Graphite', price: 17999,
    image: img('photo-1598327105666-5b89351aff97'), imageAlt: 'Смартфон Samsung Galaxy' },
];