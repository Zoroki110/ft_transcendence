import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import './Navigation.css';

const Navigation: React.FC = () => {
  const { t } = useTranslations();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Détection du scroll pour effet dynamique
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    {
      key: 'home',
      label: t('navigation.home'),
      path: '/',
      icon: '🏠'
    },
    {
      key: 'game',
      label: t('navigation.game'),
      path: '/game',
      icon: '🎮'
    },
    {
      key: 'tournaments',
      label: t('navigation.tournaments'),
      path: '/tournaments',
      icon: '🏆'
    },
    {
      key: 'create',
      label: 'Créer',
      path: '/create-tournament',
      icon: '➕'
    },
    {
      key: 'my-tournaments',
      label: 'Mes Tournois',
      path: '/my-tournaments',
      icon: '👤'
    }
  ];

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`dynamic-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo / Brand */}
        <Link to="/" className="nav-brand">
          <div className="brand-icon">🏓</div>
          <span className="brand-text">Pong Arena</span>
        </Link>

        {/* Navigation principale */}
        <div className="nav-main">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              <div className="nav-indicator"></div>
            </Link>
          ))}
        </div>

        {/* Actions utilisateur */}
        <div className="nav-actions">
          <button className="action-btn notifications">
            <span className="action-icon">🔔</span>
            <div className="notification-badge">3</div>
          </button>
          
          <Link to="/profile" className="action-btn profile">
            <div className="profile-avatar">
              <span>JD</span>
            </div>
            <span className="profile-name">Jacob</span>
          </Link>
        </div>

        {/* Menu burger mobile */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Menu mobile overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={handleMobileMenuClick}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </Link>
            ))}
            
            <div className="mobile-actions">
              <button className="mobile-action-btn">
                <span>🔔</span>
                <span>Notifications</span>
              </button>
              <Link to="/profile" className="mobile-action-btn" onClick={handleMobileMenuClick}>
                <span>👤</span>
                <span>Profil</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;