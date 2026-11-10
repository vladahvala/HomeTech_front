import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useClickOutside } from '../hooks/useClickOutside';

/** Іконка акаунта в меню: для гостя — «Увійти / Зареєструватися», для користувача — кабінет і вихід */
export default function UserMenu() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  useClickOutside(menuRef, close, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // після входу повернемося на сторінку, з якої прийшли (UC-ACC-02)
  const returnTo = { from: location.pathname + location.search };

  const handleLogout = async () => {
    close();
    navigate('/'); // UC-ACC-03: після виходу — головна; кошик лишається
    await logout();
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__toggle"
        aria-label={user ? `Акаунт: ${user.fullName}` : 'Увійти або зареєструватися'}
        aria-expanded={isOpen}
        aria-controls="user-menu-box"
        disabled={status === 'loading'}
        onClick={() => setIsOpen((value) => !value)}
      >
        <i className={user ? 'ri-user-fill' : 'ri-user-line'} />
      </button>

      {isOpen && (
        <div className="user-menu__box" id="user-menu-box">
          {user ? (
            <>
              <p className="user-menu__name">{user.fullName}</p>
              <p className="user-menu__email">{user.email}</p>

              {user.role === 'admin' ? (
                <Link className="user-menu__link" to="/admin/orders" onClick={close}>
                  Адмінка
                </Link>
              ) : (
                <>
                  <Link className="user-menu__link" to="/account/orders" onClick={close}>
                    Мої замовлення
                  </Link>
                  <Link className="user-menu__link" to="/account/profile" onClick={close}>
                    Профіль
                  </Link>
                </>
              )}
              <Link className="user-menu__link" to="/account/password" onClick={close}>
                Зміна пароля
              </Link>

              <button type="button" className="user-menu__link" onClick={handleLogout}>
                Вийти
              </button>
            </>
          ) : (
            <>
              <Link className="user-menu__link" to="/login" state={returnTo} onClick={close}>
                Увійти
              </Link>
              <Link className="user-menu__link" to="/register" state={returnTo} onClick={close}>
                Зареєструватися
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
