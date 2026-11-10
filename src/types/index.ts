export interface NavLink {
  href: string;
  label: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  /** Стара ціна — якщо задана, показується знижка */
  oldPrice?: number;
  image: string;
  imageAlt: string;
  /** Фото для сторінки товару. Якщо немає — використовується image */
  gallery?: string[];
  description: string;
}

/** Рядок кошика: товар і кількість */
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Slide {
  id: number;
  image: string;
  alt: string;
}

export interface Subcategory {
  label: string;
  href: string;
}

export interface Category {
  id: string;
  title: string;
  items: Subcategory[];
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}