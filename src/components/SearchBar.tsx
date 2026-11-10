import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';

export const SEARCH_MIN = 2;
export const SEARCH_MAX = 100;

/** Пошук товарів за назвою або артикулом (UC-CAT-03) */
export default function SearchBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  // на сторінці результатів у полі лишається поточний запит
  useEffect(() => {
    if (location.pathname === '/search') {
      setText(new URLSearchParams(location.search).get('q') ?? '');
    }
  }, [location.pathname, location.search]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = text.trim();

    if (query.length < SEARCH_MIN || query.length > SEARCH_MAX) {
      setError(`Введіть від ${SEARCH_MIN} до ${SEARCH_MAX} символів, наприклад «чайник» або артикул.`);
      return;
    }

    setError('');
    navigate(`/search?${new URLSearchParams({ q: query })}`);
  };

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit} noValidate>
      <div className="search-bar__inner">
        <label className="visually-hidden" htmlFor="site-search">
          Пошук товарів
        </label>
        <input
          id="site-search"
          className="search-bar__input"
          type="search"
          placeholder="Пошук: назва або артикул"
          value={text}
          maxLength={SEARCH_MAX}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'site-search-error' : undefined}
          onChange={(event) => {
            setText(event.target.value);
            setError('');
          }}
        />
        <button className="search-bar__button" type="submit" aria-label="Знайти">
          <i className="ri-search-line" />
        </button>
      </div>
      {error && (
        <p id="site-search-error" className="search-bar__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
