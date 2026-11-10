import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { CategoryFilters, ProductQuery } from '../types';
import { hasActiveFilters } from '../utils/catalogQuery';
import { formatCharacteristicValue } from '../utils/labels';

interface CatalogFiltersProps {
  filters: CategoryFilters;
  query: ProductQuery;
  onChange: (changes: Partial<ProductQuery>) => void;
}

/** Додає значення до списку або прибирає його, якщо воно вже є */
function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const isDesktop = () =>
  typeof window === 'undefined' || window.matchMedia('(min-width: 769px)').matches;

/** Фільтри категорії: виробник, ціна, наявність, характеристики (UC-CAT-02) */
export default function CatalogFilters({ filters, query, onChange }: CatalogFiltersProps) {
  // на телефоні фільтри згорнуті, щоб одразу було видно товари
  const [isOpen, setIsOpen] = useState(isDesktop);

  const [priceMin, setPriceMin] = useState(query.priceMin?.toString() ?? '');
  const [priceMax, setPriceMax] = useState(query.priceMax?.toString() ?? '');
  const [priceError, setPriceError] = useState('');

  // якщо фільтри скинули чи відкрили інше посилання — оновлюємо поля ціни
  useEffect(() => {
    setPriceMin(query.priceMin?.toString() ?? '');
    setPriceMax(query.priceMax?.toString() ?? '');
    setPriceError('');
  }, [query.priceMin, query.priceMax]);

  const applyPrice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const min = priceMin.trim() === '' ? undefined : Number(priceMin);
    const max = priceMax.trim() === '' ? undefined : Number(priceMax);

    if ((min !== undefined && !(min >= 0)) || (max !== undefined && !(max >= 0))) {
      setPriceError('Ціна має бути числом від 0. Виправте значення.');
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError('Мінімальна ціна більша за максимальну. Поміняйте значення місцями.');
      return;
    }
    setPriceError('');
    onChange({ priceMin: min, priceMax: max });
  };

  const resetAll = () =>
    onChange({
      manufacturers: [],
      priceMin: undefined,
      priceMax: undefined,
      inStockOnly: false,
      promoOnly: false,
      characteristics: {},
    });

  return (
    <details
      className="filters"
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="filters__summary">Фільтри</summary>

      <div className="filters__body">
        <label className="filters__option filters__option--stock">
          <input
            type="checkbox"
            checked={query.inStockOnly}
            onChange={(event) => onChange({ inStockOnly: event.target.checked })}
          />
          Лише в наявності
        </label>
        <label className="filters__option filters__option--stock">
          <input
            type="checkbox"
            checked={!!query.promoOnly}
            onChange={(event) => onChange({ promoOnly: event.target.checked })}
          />
          Лише акційні
        </label>

        <form className="filters__group" onSubmit={applyPrice} noValidate>
          <fieldset className="filters__fieldset">
            <legend className="filters__title">Ціна, грн</legend>
            <div className="filters__price">
              <label className="visually-hidden" htmlFor="price-min">
                Ціна від
              </label>
              <input
                id="price-min"
                className="filters__input"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={`від ${filters.priceMin}`}
                value={priceMin}
                onChange={(event) => setPriceMin(event.target.value)}
              />
              <span aria-hidden="true">—</span>
              <label className="visually-hidden" htmlFor="price-max">
                Ціна до
              </label>
              <input
                id="price-max"
                className="filters__input"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder={`до ${filters.priceMax}`}
                value={priceMax}
                onChange={(event) => setPriceMax(event.target.value)}
              />
            </div>
            {priceError && (
              <p className="filters__error" role="alert">
                {priceError}
              </p>
            )}
            <button className="filters__apply" type="submit">
              Застосувати
            </button>
          </fieldset>
        </form>

        {filters.manufacturers.length > 0 && (
          <fieldset className="filters__group filters__fieldset">
            <legend className="filters__title">Виробник</legend>
            {filters.manufacturers.map((manufacturer) => (
              <label key={manufacturer.id} className="filters__option">
                <input
                  type="checkbox"
                  checked={query.manufacturers.includes(manufacturer.id)}
                  onChange={() =>
                    onChange({ manufacturers: toggle(query.manufacturers, manufacturer.id) })
                  }
                />
                {manufacturer.name}
              </label>
            ))}
          </fieldset>
        )}

        {filters.characteristics.map((characteristic) => {
          const selected = query.characteristics[characteristic.id] ?? [];
          return (
            <fieldset key={characteristic.id} className="filters__group filters__fieldset">
              <legend className="filters__title">{characteristic.name}</legend>
              {characteristic.values.map((value) => (
                <label key={value} className="filters__option">
                  <input
                    type="checkbox"
                    checked={selected.includes(value)}
                    onChange={() =>
                      onChange({
                        characteristics: {
                          ...query.characteristics,
                          [characteristic.id]: toggle(selected, value),
                        },
                      })
                    }
                  />
                  {formatCharacteristicValue(value, characteristic.type, characteristic.unit)}
                </label>
              ))}
            </fieldset>
          );
        })}

        {hasActiveFilters(query) && (
          <button className="filters__reset" type="button" onClick={resetAll}>
            Скинути фільтри
          </button>
        )}
      </div>
    </details>
  );
}
