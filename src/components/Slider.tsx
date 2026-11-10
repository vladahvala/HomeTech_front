import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useSlider } from '../hooks/useSlider';
import type { Slide } from '../types';
import { mod } from '../utils/format';

const DRAG_THRESHOLD = 50; // px, щоб перемкнути слайд
const CENTER_OFFSET = 2;   // центральний слайд = pos-3

export default function Slider({ slides, interval = 4000 }: { slides: Slide[]; interval?: number }) {
  const { current, goTo, next, prev, startAutoplay, stopAutoplay } =
    useSlider(slides.length, { initialIndex: CENTER_OFFSET, interval });

  const dragRef = useRef({ active: false, startX: 0 });
  const [isGrabbing, setIsGrabbing] = useState(false);

  // будь-яка ручна дія перезапускає автоперемикання
  const withRestart = (action: () => void) => () => {
    action();
    startAutoplay();
  };

  const handleDotKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goTo(index);
      startAutoplay();
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, .slider__dot')) return;
    dragRef.current = { active: true, startX: event.clientX };
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
    if (difference < 0) next();
    else prev();
    finishDrag();
  };

  return (
    <section className="slider">
      <div
        className="slider__track"
        style={isGrabbing ? { cursor: 'grabbing' } : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerLeave={finishDrag}
        onPointerCancel={finishDrag}
        onDragStart={(event) => event.preventDefault()}
      >
        {slides.map((slide, index) => {
          const position = mod(index - current + CENTER_OFFSET, slides.length) + 1;
          return (
            <img
              key={slide.id}
              className={`slider__item slider__item--pos-${position}`}
              src={slide.image}
              alt={slide.alt}
              draggable={false}
            />
          );
        })}

        <div className="slider__controls">
          <button type="button" className="slider__button slider__button--prev"
            aria-label="Попередній слайд" onClick={withRestart(prev)}>
            <i className="ri-arrow-left-s-line" />
          </button>
          <button type="button" className="slider__button slider__button--next"
            aria-label="Наступний слайд" onClick={withRestart(next)}>
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>

        <ul className="slider__nav">
          {slides.map((slide, index) => {
            const isActive = index === current;
            return (
              <li
                key={slide.id}
                className={`slider__dot${isActive ? ' slider__dot--active' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Слайд ${index + 1}`}
                aria-current={isActive ? 'true' : 'false'}
                onClick={withRestart(() => goTo(index))}
                onKeyDown={(event) => handleDotKeyDown(event, index)}
              />
            );
          })}
        </ul>
      </div>
    </section>
  );
}