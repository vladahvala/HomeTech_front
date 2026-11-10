import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Footer from './components/Footer';
import Menu from './components/Menu';
import RequireAuth from './components/RequireAuth';
import ScrollManager from './components/ScrollManager';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { footerLinks, mainMenu, socialLinks } from './data/site';
import AccountPage from './pages/AccountPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ProductPage from './pages/ProductPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ScrollManager />
          <Menu links={mainMenu} />

          <Routes>
            {/* Гість і всі інші */}
            <Route path="/" element={<HomePage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Клієнт */}
            <Route
              path="/account"
              element={
                <RequireAuth role="client">
                  <AccountPage />
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

            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <Footer links={footerLinks} socialLinks={socialLinks} />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
