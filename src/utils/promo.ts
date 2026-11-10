// Акції: правила спільні для каталогу, адмінки й моків (бекенд рахує так само)

/**
 * Акція діє, якщо задано акційну ціну, вона менша за звичайну
 * і останній день акції ('YYYY-MM-DD', київський час) ще не минув.
 */
export function isPromoActive(
  price: number | null,
  promoPrice: number | null,
  promoUntil: string | null,
  today: string,
): boolean {
  if (price === null || promoPrice === null || promoPrice >= price) return false;
  return promoUntil === null || promoUntil >= today;
}

/** Знижка у відсотках для бейджа «−15%» */
export function discountPercent(oldPrice: number, price: number): number {
  return Math.max(1, Math.round((1 - price / oldPrice) * 100));
}
