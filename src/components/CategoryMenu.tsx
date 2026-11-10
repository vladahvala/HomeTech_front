import { Fragment, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Category } from '../types';

export default function CategoryMenu({ categories, className = '' }: { categories: Category[]; className?: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLElement>(null);

  // закриваємо меню при кліку поза ним
  useEffect(() => {
    if (openId === null) return;
    const handleDocumentClick = (event: globalThis.MouseEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpenId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [openId]);

  const handleToggle = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <aside ref={menuRef} className={`category-menu ${className}`.trim()}>
      {categories.map((category) => {
        const isOpen = category.id === openId;
        return (
          <Fragment key={category.id}>
            <a href="#" role="button" className="category-menu__toggle"
              aria-expanded={isOpen} aria-controls={category.id}
              onClick={(event) => handleToggle(event, category.id)}>
              {category.title}
            </a>
            {/* inert: Tab не заходить у згорнутий список */}
            <ul id={category.id} inert={!isOpen}
              className={`category-menu__list${isOpen ? ' category-menu__list--open' : ''}`}>
              {category.items.map((item) => (
                <li key={item.label} className="category-menu__item">
                  <a className="category-menu__link" href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </Fragment>
        );
      })}
    </aside>
  );
}