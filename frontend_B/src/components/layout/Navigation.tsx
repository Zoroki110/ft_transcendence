import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import LanguageSelector from '../i18n/LanguageSelector';

const Navigation: React.FC = () => {
  const { t } = useTranslations();
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: t('navigation.home'), icon: '🏠' },
    { path: '/tournaments', label: t('navigation.tournaments'), icon: '🏆' },
    { path: '/profile', label: t('navigation.profile'), icon: '👤' },
    { path: '/game', label: t('navigation.game'), icon: '🎮' },
  ];
  
  return (
    <nav className="nav-gaming">
      <div className="nav-container-gaming">
        <Link to="/" className="nav-logo-gaming">
          <span className="logo-icon">⚡</span>
          TRANSCENDENCE
        </Link>
        
        <div className="nav-links-gaming">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link-gaming ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
              <div className="nav-glow"></div>
            </Link>
          ))}
          
          <div className="language-wrapper">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
