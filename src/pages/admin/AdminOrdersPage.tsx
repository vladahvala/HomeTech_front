import { useAuth } from '../../context/AuthContext';

/** Опрацювання замовлень (UC-ADM-ORD-01). Поки заглушка — наповнимо на етапі 3 */
export default function AdminOrdersPage() {
  const { user } = useAuth();

  return (
    <main className="account-page">
      <h2 className="account-page__title">Замовлення магазину</h2>
      <p className="account-page__note">
        Вітаємо, {user?.fullName}. Тут буде список замовлень зі зміною статусів, а поруч — керування
        товарами, категоріями й клієнтами.
      </p>
    </main>
  );
}
