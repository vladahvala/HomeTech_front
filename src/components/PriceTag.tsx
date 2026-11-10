import { formatPrice } from '../utils/format';
import { discountPercent } from '../utils/promo';

interface PriceTagProps {
  price: number;
  /** Звичайна ціна, якщо діє акція */
  oldPrice?: number | null;
  className?: string;
}

/** Ціна; під час акції — нова ціна, закреслена стара й бейдж «−15%» */
export default function PriceTag({ price, oldPrice, className = '' }: PriceTagProps) {
  const isPromo = typeof oldPrice === 'number' && oldPrice > price;
  return (
    <span className={`price-tag ${className}`.trim()}>
      <span className={`price-tag__current${isPromo ? ' price-tag__current--promo' : ''}`}>
        {isPromo && <span className="visually-hidden">Ціна зі знижкою: </span>}
        {formatPrice(price)}
      </span>
      {isPromo && (
        <>
          <s className="price-tag__old">
            <span className="visually-hidden">Звичайна ціна: </span>
            {formatPrice(oldPrice)}
          </s>
          <span className="price-tag__badge">−{discountPercent(oldPrice, price)}%</span>
        </>
      )}
    </span>
  );
}
