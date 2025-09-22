// frontend_B/src/components/Navigation.tsx - AVEC DROPDOWN PROFIL

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/tournaments', label: 'Tournaments', icon: '🏆' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '📊' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fermer le dropdown quand on navigue
  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleDropdownItemClick = (action: string) => {
    setIsProfileDropdownOpen(false);
    
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        // Pour l'instant, rediriger vers profil
        navigate('/profile');
        break;
      case 'logout':
        // Simuler une déconnexion
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
          console.log('🚪 Déconnexion simulée');
          // Plus tard: logique de déconnexion réelle
        }
        break;
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">🏓</span>
          <span className="brand-text">Transcendence</span>
        </Link>
        
        <div className="nav-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-user">
          {isLoggedIn && user ? (
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button 
                className="profile-button"
                onClick={handleProfileClick}
                aria-label="Menu profil"
              >
                <span className="user-avatar">{user.avatar}</span>
                <span className="user-name">{user.username}</span>
                <span className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user.avatar}
                    </div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-username">{user.displayName || user.username}</div>
                      <div className="dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  <div className="dropdown-items">
                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('profile')}
                    >
                      <span className="dropdown-icon">👤</span>
                      <span>Mon Profil</span>
                    </button>
                    
                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('settings')}
                    >
                      <span className="dropdown-icon">⚙️</span>
                      <span>Paramètres</span>
                    </button>
                    
                    <div className="dropdown-divider"></div>
                    
                    <div className="dropdown-stats">
                      <div className="stat-item">
                        <span className="stat-icon">🏆</span>
                        <span className="stat-text">
                          Score: <strong>{user.totalScore}</strong>
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">🎯</span>
                        <span className="stat-text">
                          Victoires: <strong>{user.gamesWon}</strong>
                        </span>
                      </div>
                      {user.totalGames > 0 && (
                        <div className="stat-item">
                          <span className="stat-icon">📈</span>
                          <span className="stat-text">
                            Taux: <strong>{user.winRate.toFixed(1)}%</strong>
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button
                      className="dropdown-item logout"
                      onClick={() => handleDropdownItemClick('logout')}
                    >
                      <span className="dropdown-icon">🚪</span>
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Bouton de connexion si pas connecté
            <button className="login-button">
              <span>🔐</span>
              <span>Se connecter</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;