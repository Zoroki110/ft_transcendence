import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import LanguageSelector from '../i18n/LanguageSelector';

const Navigation: React.FC = () => {
  const { t } = useTranslations();
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Accueil', icon: '🏠', color: '#00d4ff' },
    { path: '/tournaments', label: 'Tournois', icon: '🏆', color: '#ff6b35' },
    { path: '/profile', label: 'Profil', icon: '👤', color: '#39ff14' },
    { path: '/game', label: 'Pong Arena', icon: '🎮', color: '#ff073a' }
  ];
  
  return (
    <nav className="nav-gaming-ultimate">
      <div className="nav-container-ultimate">
        {/* Logo Gaming */}
        <Link to="/" className="nav-logo-ultimate">
          <span className="logo-icon-ultimate">⚡</span>
          <span className="logo-text-ultimate">TRANSCENDENCE</span>
          <div className="logo-pulse-ultimate"></div>
        </Link>
        
        {/* Navigation Items Gaming */}
        <div className="nav-links-ultimate">
          {navItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link-ultimate ${location.pathname === item.path ? 'active' : ''}`}
              style={{'--glow-color': item.color, '--delay': `${index * 0.1}s`} as React.CSSProperties}
              data-text={item.label}
            >
              <span className="nav-icon-ultimate">{item.icon}</span>
              <span className="nav-text-ultimate">{item.label}</span>
              <div className="nav-bg-ultimate"></div>
              <div className="nav-glow-ultimate"></div>
            </Link>
          ))}
        </div>
        
        {/* Language Selector Gaming */}
        <div className="language-wrapper-ultimate">
          <LanguageSelector />
        </div>
      </div>
      
      {/* Scanning effect */}
      <div className="nav-scanner-ultimate"></div>
    </nav>
  );
};

export default Navigation;