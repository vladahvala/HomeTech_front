const priceFormatter = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });
const kopecksFormatter = new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 59999 → «59 999 грн»; 1299.5 → «1 299,50 грн» (ціна може мати копійки, таблиця 3.5) */
export function formatPrice(price: number): string {
  const formatter = Number.isInteger(price) ? priceFormatter : kopecksFormatter;
  return `${formatter.format(price)} грн`;
}

/** Остача, що завжди невід'ємна: mod(-1, 6) === 5 */
export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}