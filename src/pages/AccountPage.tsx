import { useAuth } from '../context/AuthContext';

/** Кабінет Клієнта. Поки що — дані профілю; замовлення й редагування додамо на етапі 2 */
export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null; // сюди пускає лише RequireAuth, тож user завжди є

  return (
    <main className="account-page">
      <h2 className="account-page__title">Особистий кабінет</h2>

      <dl className="account-page__details">
        <dt>ПІБ</dt>
        <dd>{user.fullName}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Телефон</dt>
        <dd>{user.phone}</dd>
      </dl>

      <p className="account-page__note">
        Архів замовлень, редагування профілю й зміна пароля з’являться тут незабаром.
      </p>
    </main>
  );
}
