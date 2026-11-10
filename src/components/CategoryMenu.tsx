import { Fragment, useCallback, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useClickOutside } from '../hooks/useClickOutside';
import { getChildren } from '../hooks/useCategories';
import type { Category } from '../types';

interface CategoryMenuProps {
  categories: Category[];
  className?: string;
}

/**
 * Ліва колонка каталогу. Категорія без підкатегорій — просто посилання,
 * з підкатегоріями — випадаючий список (відкритий лише один).
 */
export default function CategoryMenu({ categories, className = '' }: CategoryMenuProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const menuRef = useRef<HTMLElement>(null);

  const close = useCallback(() => setOpenId(null), []);
  useClickOutside(menuRef, close, openId !== null);

  return (
    <nav ref={menuRef} className={`category-menu ${className}`.trim()} aria-label="Категорії">
      {getChildren(categories, null).map((category) => {
        const children = getChildren(categories, category.id);

        if (children.length === 0) {
          return (
            <Link key={category.id} className="category-menu__toggle" to={`/catalog/${category.slug}`}>
              {category.name}
            </Link>
          );
        }

        const isOpen = category.id === openId;
        const listId = `category-${category.id}`;

        return (
          <Fragment key={category.id}>
            <button
              type="button"
              className="category-menu__toggle"
              aria-expanded={isOpen}
              aria-controls={listId}
              onClick={() => setOpenId(isOpen ? null : category.id)}
            >
              {category.name}
            </button>

            {/* inert прибирає посилання згорнутого списку з порядку Tab */}
            <ul
              id={listId}
              className={`category-menu__list${isOpen ? ' category-menu__list--open' : ''}`}
              inert={!isOpen}
            >
              {children.map((child) => (
                <li key={child.id} className="category-menu__item">
                  <Link className="category-menu__link" to={`/catalog/${child.slug}`} onClick={close}>
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Fragment>
        );
      })}
    </nav>
  );
}
