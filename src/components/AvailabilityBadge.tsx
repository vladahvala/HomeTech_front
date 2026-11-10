import type { Availability } from '../types';
import { AVAILABILITY_LABELS } from '../utils/labels';

const MODIFIERS: Record<Availability, string> = {
  in_stock: 'in-stock',
  expected: 'expected',
  out_of_stock: 'out',
};

/** «В наявності» / «Очікується» / «Немає» — колір плюс текст, щоб не покладатися лише на колір */
export default function AvailabilityBadge({ availability }: { availability: Availability }) {
  return (
    <span className={`availability availability--${MODIFIERS[availability]}`}>
      {AVAILABILITY_LABELS[availability]}
    </span>
  );
}
