import { useState } from 'react';
import placeholder from '../assets/no-photo.svg';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

/**
 * Фото товару із заглушкою (FUN-10): якщо фото немає або посилання з прайсу
 * не відкривається (D2), показуємо «Фото відсутнє».
 */
export default function ProductImage({ src, alt, className }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPlaceholder = !src || failedSrc === src;

  return (
    <img
      className={className}
      src={showPlaceholder ? placeholder : src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}
