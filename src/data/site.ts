import type { NavLink, SocialLink } from '../types';

export const SITE_NAME = 'ДомТех';
export const SITE_SLOGAN = 'Технології для комфортного життя';
export const SITE_TITLE = 'ДомТех — магазин техніки';

/**
 * Дані продавця — мають бути на кожній сторінці (FUN-11).
 * Проєкт навчальний, тому адреса й телефон умовні; для справжнього магазину замініть їх тут.
 */
export const SELLER = {
  name: 'ДомТех — навчальний проєкт інтернет-магазину побутової техніки',
  address: 'м. Київ (умовна адреса навчального проєкту)',
  phone: '+380 44 000 00 00',
  phoneHref: 'tel:+380440000000',
  email: 'info@domtech.example',
};

// Посилання ведуть на розділи головної, тому працюють і зі сторінки товару
export const mainMenu: NavLink[] = [
  { href: '/', label: 'Головна' },
  { href: '/#catalog', label: 'Каталог' },
  { href: '/#delivery', label: 'Доставка та оплата' },
  { href: '/#advantages', label: 'Наші переваги' },
  { href: '/#contacts', label: 'Контакти' },
];

export const footerLinks: NavLink[] = mainMenu.slice(1);

export const socialLinks: SocialLink[] = [
  { label: 'Facebook', href: '#', icon: 'ri-facebook-fill' },
  { label: 'Instagram', href: '#', icon: 'ri-instagram-line' },
  { label: 'Telegram', href: '#', icon: 'ri-telegram-line' },
];

export const advantages: string[] = [
  'Різноманітний асортимент техніки',
  'Зручний каталог товарів',
  'Консультації щодо вибору техніки',
  'Інформація про доставку та оплату',
];