const priceFormatter = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });

/** 59999 → «59 999 грн» */
export function formatPrice(price: number): string {
  return `${priceFormatter.format(price)} грн`;
}

/** Остача, що завжди невід'ємна: mod(-1, 6) === 5 */
export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}