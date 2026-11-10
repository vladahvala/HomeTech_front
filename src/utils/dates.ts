// Дати показуємо за київським часом у форматі «дд.мм.рррр гг:хх» (USB-05)

const TIME_ZONE = 'Europe/Kyiv';

const dateTimeFormatter = new Intl.DateTimeFormat('uk-UA', {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** '2026-11-10T07:51:00Z' → '10.11.2026 09:51' */
export function formatDateTime(iso: string): string {
  const parts = Object.fromEntries(
    dateTimeFormatter.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute}`;
}

/** '2026-11-13' → '13.11.2026' */
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** Сьогоднішня дата в Києві: '2026-11-10' */
export function kyivToday(): string {
  // формат en-CA дає саме РРРР-ММ-ДД
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}
