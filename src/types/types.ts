export interface NavLink {
  href: string;
  label: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  imageAlt: string;
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