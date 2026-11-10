import type { Category } from '../types';

const sub = (...labels: string[]) => labels.map((label) => ({ label, href: '#' }));

export const categories: Category[] = [
  { id: 'phones', title: 'Смартфони та гаджети', items: sub('Смартфони', 'Планшети', 'Смартгодинники') },
  { id: 'computers', title: "Комп'ютерна техніка", items: sub('Ноутбуки', 'Монітори', 'Комплектуючі') },
  { id: 'appliances', title: 'Побутова техніка', items: sub('Пилососи', 'Праски', 'Кухонна техніка') },
  { id: 'audio', title: 'Аудіо та відео', items: sub('Навушники', 'Колонки', 'Телевізори') },
  { id: 'accessories', title: 'Аксесуари', items: sub('Зарядні пристрої', 'Кабелі', 'Чохли') },
];