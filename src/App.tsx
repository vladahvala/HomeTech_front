import Footer from './components/Footer';
import Menu from './components/Menu';
import { footerLinks, mainMenu, socialLinks } from './data/site';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <>
      <Menu links={mainMenu} />
      <HomePage />
      <Footer links={footerLinks} socialLinks={socialLinks} />
    </>
  );
}