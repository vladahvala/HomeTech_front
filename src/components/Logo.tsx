import logoImage from '../assets/logo.png';
import { SITE_NAME, SITE_SLOGAN } from '../data/site';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`logo ${className}`.trim()}>
      <img className="logo__img" src={logoImage} alt={`Логотип ${SITE_NAME}`} />
      <div className="logo__info">
        <h1 className="logo__title">{SITE_NAME}</h1>
        <p className="logo__slogan">{SITE_SLOGAN}</p>
      </div>
    </div>
  );
}