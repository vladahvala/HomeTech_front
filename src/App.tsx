import { BrowserRouter, Route, Routes } from 'react-router';
import Footer from './components/Footer';
import Menu from './components/Menu';
import ScrollManager from './components/ScrollManager';
import { CartProvider } from './context/CartContext';
import { footerLinks, mainMenu, socialLinks } from './data/site';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import ProductPage from './pages/ProductPage';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ScrollManager />
        <Menu links={mainMenu} />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Footer links={footerLinks} socialLinks={socialLinks} />
      </CartProvider>
    </BrowserRouter>
  );
}