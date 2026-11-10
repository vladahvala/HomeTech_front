import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { Link } from 'react-router';
import { useSlider } from '../hooks/useSlider';
import type { ProductSummary } from '../types';
import { formatDate } from '../utils/dates';
import { mod } from '../utils/format';
import PriceTag from './PriceTag';
import ProductImage from './ProductImage';

const DRAG_THRESHOLD = 50; // px, щоб перемкнути слайд
const CENTER = 3; // позиція центрального слайда (slider__item--pos-3)

/**
 * Позиція слайда відносно поточного: 1–5 видно (3 — по центру), 6 — сховано.
 * Рахуємо найкоротшу відстань по колу, тож працює і з 1–4 акціями.
 */
function positionOf(index: number, current: number, count: number): number {
  let offset = mod(index - current, count);
  if (offset > count / 2) offset -= count;
  return Math.abs(offset) <= 2 ? CENTER + offset : 6;
}

interface SliderProps {
  /** Акційні товари: у кожного є oldPrice */
  products: ProductSummary[];
  interval?: number;
}

/** Карусель акцій і спеціальних пропозицій на головній */
export default function Slider({ products, interval = 5000 }: SliderProps) {
  const { current, goTo, next, prev, startAutoplay, stopAutoplay } = useSlider(products.length, { interval });

  const dragRef = useRef({ active: false, startX: 0, moved: false });
  const [isGrabbing, setIsGrabbing] = useState(false);

  // ручні дії відбуваються, поки курсор чи фокус у каруселі, — автоперемикання стоїть
  // і відновиться, коли користувач піде з каруселі (onMouseLeave / onBlur)
  const withRestart = (action: () => void) => () => action();

  const handleDotKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goTo(index);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, .slider__dot')) return;
    dragRef.current = { active: true, startX: event.clientX, moved: false };
    setIsGrabbing(true);
    stopAutoplay();
  };

  const finishDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsGrabbing(false);
    startAutoplay();
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const difference = event.clientX - dragRef.current.startX;
    if (Math.abs(difference) < DRAG_THRESHOLD) return;
    dragRef.current.moved = true; // клік після перетягування не відкриває товар
    if (difference < 0) next();
    else prev();
    finishDrag();
  };

  // бічний слайд — спершу стає центральним; центральний відкриває товар
  const handleSlideClick = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      dragRef.current.moved = false;
      return;
    }
    if (index !== current) {
      event.preventDefault();
      goTo(index);
    }
  };

  return (
    <section className="slider" aria-roledescription="карусель" aria-label="Акції та спеціальні пропозиції">
      <div className="slider__header">
        <h2 className="slider__title">Акції та спеціальні пропозиції</h2>
        <Link className="slider__all" to="/promotions">
          Усі акції →
        </Link>
      </div>

      {/* наведення чи фокус зупиняють автоперемикання (WCAG 2.2.2) */}
      <div
        className="slider__track"
        style={isGrabbing ? { cursor: 'grabbing' } : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerLeave={finishDrag}
        onPointerCancel={finishDrag}
        onMouseEnter={stopAutoplay}
        onMouseLeave={startAutoplay}
        onFocus={stopAutoplay}
        onBlur={startAutoplay}
        onDragStart={(event) => event.preventDefault()}
      >
        {products.map((product, index) => {
          const position = positionOf(index, current, products.length);
          const isCurrent = position === CENTER;
          return (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className={`slider__item slider__item--pos-${position} promo-slide`}
              // у порядку Tab лише центральний слайд; бічні перемикають стрілки й точки
              tabIndex={isCurrent ? 0 : -1}
              aria-hidden={isCurrent ? undefined : true}
              draggable={false}
              onClick={(event) => handleSlideClick(event, index)}
            >
              <ProductImage className="promo-slide__image" src={product.imageUrl} alt="" />
              <span className="promo-slide__body">
                <span className="promo-slide__name">{product.name}</span>
                <PriceTag className="promo-slide__price" price={product.price} oldPrice={product.oldPrice} />
                <span className="promo-slide__until">
                  {product.promoUntil ? `до ${formatDate(product.promoUntil)}` : 'Спеціальна пропозиція'}
                </span>
              </span>
            </Link>
          );
        })}

        {products.length > 1 && (
          <div className="slider__controls">
            <button
              type="button"
              className="slider__button slider__button--prev"
              aria-label="Попередня пропозиція"
              onClick={withRestart(prev)}
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            <button
              type="button"
              className="slider__button slider__button--next"
              aria-label="Наступна пропозиція"
              onClick={withRestart(next)}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        )}

        {products.length > 1 && (
          <ul className="slider__nav">
            {products.map((product, index) => {
              const isActive = index === current;
              return (
                <li
                  key={product.id}
                  className={`slider__dot${isActive ? ' slider__dot--active' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Пропозиція ${index + 1}: ${product.name}`}
                  aria-current={isActive ? 'true' : 'false'}
                  onClick={withRestart(() => goTo(index))}
                  onKeyDown={(event) => handleDotKeyDown(event, index)}
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
