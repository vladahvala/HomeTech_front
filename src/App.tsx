import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Footer from './components/Footer';
import Menu from './components/Menu';
import RequireAuth from './components/RequireAuth';
import SearchBar from './components/SearchBar';
import ScrollManager from './components/ScrollManager';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { footerLinks, mainMenu, socialLinks } from './data/site';
import OrderPage from './pages/account/OrderPage';
import OrdersPage from './pages/account/OrdersPage';
import PasswordPage from './pages/account/PasswordPage';
import ProfilePage from './pages/account/ProfilePage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCategoryPage from './pages/admin/AdminCategoryPage';
import AdminClientPage from './pages/admin/AdminClientPage';
import AdminClientsPage from './pages/admin/AdminClientsPage';
import AdminImportPage from './pages/admin/AdminImportPage';
import AdminManufacturersPage from './pages/admin/AdminManufacturersPage';
import AdminOrderPage from './pages/admin/AdminOrderPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductPage from './pages/admin/AdminProductPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import CartPage from './pages/CartPage';
import CatalogPage from './pages/CatalogPage';
import CategoryPage from './pages/CategoryPage';
import CheckoutPage from './pages/CheckoutPage';
import ContactsPage from './pages/ContactsPage';
import DeliveryPage from './pages/DeliveryPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProductPage from './pages/ProductPage';
import PromotionsPage from './pages/PromotionsPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollManager />
          <Menu links={mainMenu} />
          <SearchBar />

          <Routes>
            {/* Гість і всі інші */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            {/* оформлення саме показує «Увійдіть» гостю й повідомлення адміну (А1, А2) */}
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order/success" element={<OrderSuccessPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Клієнт */}
            <Route path="/account" element={<Navigate to="/account/orders" replace />} />
            <Route
              path="/account/orders"
              element={
                <RequireAuth role="client">
                  <OrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/account/orders/:number"
              element={
                <RequireAuth role="client">
                  <OrderPage />
                </RequireAuth>
              }
            />
            <Route
              path="/account/profile"
              element={
                <RequireAuth role="client">
                  <ProfilePage />
                </RequireAuth>
              }
            />
            {/* пароль змінюють і Клієнт, і Адміністратор (UC-ACC-05) */}
            <Route
              path="/account/password"
              element={
                <RequireAuth>
                  <PasswordPage />
                </RequireAuth>
              }
            />

            {/* Адміністратор */}
            <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
            <Route
              path="/admin/orders"
              element={
                <RequireAuth role="admin">
                  <AdminOrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/orders/:number"
              element={
                <RequireAuth role="admin">
                  <AdminOrderPage />
                </RequireAuth>
              }
            />

            <Route
              path="/admin/products"
              element={
                <RequireAuth role="admin">
                  <AdminProductsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <RequireAuth role="admin">
                  <AdminProductPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/products/:id"
              element={
                <RequireAuth role="admin">
                  <AdminProductPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <RequireAuth role="admin">
                  <AdminCategoriesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/categories/new"
              element={
                <RequireAuth role="admin">
                  <AdminCategoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/categories/:id"
              element={
                <RequireAuth role="admin">
                  <AdminCategoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/manufacturers"
              element={
                <RequireAuth role="admin">
                  <AdminManufacturersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <RequireAuth role="admin">
                  <AdminClientsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/clients/new"
              element={
                <RequireAuth role="admin">
                  <AdminClientPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/clients/:id"
              element={
                <RequireAuth role="admin">
                  <AdminClientPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/import"
              element={
                <RequireAuth role="admin">
                  <AdminImportPage />
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Footer links={footerLinks} socialLinks={socialLinks} />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
