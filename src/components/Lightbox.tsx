import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { mod } from '../utils/format';
import ProductImage from './ProductImage';
import Thumbnails from './Thumbnails';

interface LightboxProps {
  images: string[];
  index: number;
  alt: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Повноекранний перегляд фото: Esc закриває, стрілки ← → гортають */
export default function Lightbox({ images, index, alt, onIndexChange, onClose }: LightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const hasMany = count > 1;

  // при відкритті: фокус на «закрити», сторінка під вікном не прокручується;
  // при закритті: фокус повертається туди, де був
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (hasMany && event.key === 'ArrowLeft') onIndexChange(mod(index - 1, count));
      else if (hasMany && event.key === 'ArrowRight') onIndexChange(mod(index + 1, count));
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [count, hasMany, index, onClose, onIndexChange]);

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      // клік по темному фону закриває вікно
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="lightbox__content">
        <button
          ref={closeButtonRef}
          type="button"
          className="lightbox__close"
          aria-label="Закрити"
          onClick={onClose}
        >
          <i className="ri-close-line" />
        </button>

        <div className="lightbox__main">
          <ProductImage className="lightbox__image" src={images[index]} alt={alt} />

          {hasMany && (
            <>
              <button
                type="button"
                className="nav-arrow nav-arrow--prev"
                aria-label="Попереднє фото"
                onClick={() => onIndexChange(mod(index - 1, count))}
              >
                <i className="ri-arrow-left-s-line" />
              </button>
              <button
                type="button"
                className="nav-arrow nav-arrow--next"
                aria-label="Наступне фото"
                onClick={() => onIndexChange(mod(index + 1, count))}
              >
                <i className="ri-arrow-right-s-line" />
              </button>
            </>
          )}
        </div>

        {hasMany && <Thumbnails images={images} current={index} alt={alt} onSelect={onIndexChange} />}
      </div>
    </div>,
    document.body,
  );
}
