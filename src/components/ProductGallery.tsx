import { useCallback, useState } from 'react';
import { mod } from '../utils/format';
import Lightbox from './Lightbox';
import Thumbnails from './Thumbnails';

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

/** Головне фото товару, стрілки, мініатюри; клік по фото відкриває повноекранний перегляд */
export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const count = images.length;
  const hasMany = count > 1;

  const closeLightbox = useCallback(() => setIsLightboxOpen(false), []);

  return (
    <section className="gallery" aria-label="Фото товару">
      <div className="gallery__main">
        <button
          type="button"
          className="gallery__open"
          aria-label="Відкрити фото на весь екран"
          onClick={() => setIsLightboxOpen(true)}
        >
          <img className="gallery__image" src={images[index]} alt={alt} />
        </button>

        {hasMany && (
          <>
            <button
              type="button"
              className="nav-arrow nav-arrow--prev"
              aria-label="Попереднє фото"
              onClick={() => setIndex((value) => mod(value - 1, count))}
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            <button
              type="button"
              className="nav-arrow nav-arrow--next"
              aria-label="Наступне фото"
              onClick={() => setIndex((value) => mod(value + 1, count))}
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </>
        )}
      </div>

      {hasMany && <Thumbnails images={images} current={index} alt={alt} onSelect={setIndex} />}

      {isLightboxOpen && (
        <Lightbox
          images={images}
          index={index}
          alt={alt}
          onIndexChange={setIndex}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}