interface ThumbnailsProps {
  images: string[];
  current: number;
  alt: string;
  onSelect: (index: number) => void;
}

/** Мініатюри під головним фото — і на сторінці, і в повноекранному перегляді */
export default function Thumbnails({ images, current, alt, onSelect }: ThumbnailsProps) {
  return (
    <div className="thumbnails">
      {images.map((image, index) => {
        const isActive = index === current;

        return (
          <button
            key={image}
            type="button"
            className={`thumbnails__button${isActive ? ' thumbnails__button--active' : ''}`}
            aria-label={`Фото ${index + 1}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(index)}
          >
            <img className="thumbnails__image" src={image} alt={`${alt}, фото ${index + 1}`} />
          </button>
        );
      })}
    </div>
  );
}
