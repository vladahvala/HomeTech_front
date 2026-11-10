interface QuantityPickerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Кнопки «−» і «+» з кількістю між ними */
export default function QuantityPicker({ value, onChange, min = 1, max = 99 }: QuantityPickerProps) {
  return (
    <div className="quantity" role="group" aria-label="Кількість">
      <button
        type="button"
        className="quantity__button"
        aria-label="Зменшити кількість"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <i className="ri-subtract-line" />
      </button>

      <span className="quantity__value" aria-live="polite">
        {value}
      </span>

      <button
        type="button"
        className="quantity__button"
        aria-label="Збільшити кількість"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <i className="ri-add-line" />
      </button>
    </div>
  );
}