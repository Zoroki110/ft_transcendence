// frontend_B/src/components/Navigation.tsx - CONNECTÉ AU USERCONTEXT

import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { gameAPI, userAPI } from '../services/api';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🎯 UTILISER LE VRAI CONTEXTE UTILISATEUR
  const { user, isLoggedIn, logout } = useUser();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  // 🎮 Fonction pour créer une partie rapide (identique à Home.tsx)
  const handleQuickPlay = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      setIsCreatingGame(true);
      console.log('🟢 NAVIGATION: Appel API createQuickMatch à', new Date().toISOString());
      const response = await gameAPI.createQuickMatch();
      console.log('🟢 NAVIGATION: Réponse API reçue:', response.data);
      console.log('🟢 NAVIGATION: Navigation vers /matchmaking');
      navigate('/matchmaking');
    } catch (error) {
      console.error('🔴 NAVIGATION: Erreur lors de la création de la partie:', error);
      alert('Impossible de créer une partie. Veuillez réessayer.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const navItems = [
    {
      path: '/',
      label: 'Accueil',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      )
    },
    {
      path: '/matchmaking',
      label: 'Jouer',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.58 16.09l-1.09-7.66A3.996 3.996 0 0016.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      )
    },
    {
      path: '/tournaments',
      label: 'Tournois',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
        </svg>
      )
    },
    {
      path: '/friends',
      label: 'Amis',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      )
    },
    {
      path: '/chat',
      label: 'Messages',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
      )
    },
    {
      path: '/leaderboard',
      label: 'Classement',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11V3H8v6H2v12h20V11h-6zm-6-6h4v14h-4V5zm-6 6h4v8H4v-8zm16 8h-4v-6h4v6z"/>
        </svg>
      )
    },
    {
      path: '/profile',
      label: 'Profil',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )
    },
  ];

  // Charger le nombre de demandes d'ami en attente
  useEffect(() => {
    const loadFriendRequests = async () => {
      if (!isLoggedIn) return;

      try {
        const response = await userAPI.getPendingFriendRequests();
        setFriendRequestsCount(response.data.length);
      } catch (err) {
        console.error('Erreur lors du chargement des demandes d\'ami:', err);
      }
    };

    loadFriendRequests();

    // Recharger toutes les 30 secondes
    const interval = setInterval(loadFriendRequests, 30000);

    // Écouter l'événement de nouvelle demande d'ami
    const handleFriendRequestReceived = () => {
      loadFriendRequests();
    };

    window.addEventListener('friendRequestReceived', handleFriendRequestReceived);

    return () => {
      clearInterval(interval);
      window.removeEventListener('friendRequestReceived', handleFriendRequestReceived);
    };
  }, [isLoggedIn]);

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
    console.log('🖱️ Clic sur le profil, dropdown ouvert:', !isProfileDropdownOpen);
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleDropdownItemClick = (action: string) => {
    console.log('🖱️ Action dropdown:', action);
    setIsProfileDropdownOpen(false);

    switch (action) {
      case 'game':
        handleQuickPlay();
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'tournaments':
        navigate('/tournaments');
        break;
      case 'friends':
        navigate('/friends');
        break;
      case 'chat':
        navigate('/chat');
        break;
      case 'logout':
        if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
          logout(); // 🎯 Utiliser la vraie fonction logout
        }
        break;
    }
  };

  // 🎨 Helper pour afficher les statistiques
  const formatStats = () => {
    if (!user) return null;

    // Calcul sécurisé du taux de victoire
    const totalGames = (user.gamesWon || 0) + (user.gamesLost || 0);
    const winRate = totalGames > 0 ? ((user.gamesWon || 0) / totalGames) * 100 : 0;

    return {
      gamesText: totalGames === 0 ? 'Aucune partie' : `${totalGames} parties`,
      winsText: (user.gamesWon || 0) === 0 ? 'Aucune victoire' : `${user.gamesWon} victoires`,
      winRateText: `${winRate.toFixed(1)}%`,
      tournamentsText: (user.tournamentsWon || 0) === 0 ? 'Aucun tournoi' : `${user.tournamentsWon} tournois`
    };
  };

  const stats = formatStats();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <svg className="brand-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span className="brand-text">ft_transcendence</span>
        </Link>
        
        <div className="nav-links">
          {navItems.map((item) => {
            // Cas spécial pour "Jouer" - utiliser handleQuickPlay au lieu d'un lien
            if (item.path === '/matchmaking') {
              return (
                <button
                  key={item.path}
                  onClick={handleQuickPlay}
                  disabled={isCreatingGame}
                  className={`nav-link nav-button ${isCreatingGame ? 'loading' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: isCreatingGame ? 'wait' : 'pointer',
                    opacity: isCreatingGame ? 0.7 : 1,
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    color: 'inherit',
                    padding: '0',
                    margin: '0',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem'
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">
                    {isCreatingGame ? 'Recherche...' : item.label}
                  </span>
                </button>
              );
            }

            // Autres liens normaux
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.path === '/friends' && friendRequestsCount > 0 && (
                  <span className="nav-badge">{friendRequestsCount}</span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="nav-user">
          {isLoggedIn && user ? (
            <div className="profile-dropdown-container" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={handleProfileClick}
                aria-label="Menu profil"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: '25px',
                  padding: '0.375rem 1rem 0.375rem 0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span className="user-avatar" style={{
                  width: '40px',
                  height: '40px',
                  background: '#667eea',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  {user.avatar || (
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '24px', height: '24px' }}>
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </span>
                <span className="user-name" style={{ fontWeight: '600', color: '#4a5568' }}>
                  {user.username}
                </span>
                <span className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`} style={{
                  fontSize: '0.75rem',
                  color: '#a0aec0',
                  transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}>
                  ▼
                </span>
              </button>

              {/* 🎯 DROPDOWN AVEC VRAIES DONNÉES */}
              {isProfileDropdownOpen && (
                <div className="profile-dropdown" style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  width: '280px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  zIndex: 1001,
                  marginTop: '0.5rem',
                  overflow: 'hidden'
                }}>
                  {/* Header avec vraies données utilisateur */}
                  <div className="dropdown-header" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    <div className="dropdown-avatar" style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      {user.avatar || '👤'}
                    </div>
                    <div className="dropdown-user-info" style={{ flex: '1' }}>
                      <div className="dropdown-username" style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                        {user.displayName || user.username}
                      </div>
                      <div className="dropdown-email" style={{ fontSize: '0.85rem', opacity: '0.9' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                  
                  {/* 📊 Statistiques réelles */}
                  {stats && (
                    <div className="dropdown-stats" style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', color: '#667eea' }}>
                            <path d="M21.58 16.09l-1.09-7.66A3.996 3.996 0 0016.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91z"/>
                          </svg>
                          <span style={{ color: '#667eea', fontWeight: '600' }}>{stats.gamesText}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', color: '#fbbf24' }}>
                            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                          </svg>
                          <span style={{ color: '#667eea', fontWeight: '600' }}>{stats.winsText}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', color: '#10b981' }}>
                            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                          </svg>
                          <span style={{ color: '#667eea', fontWeight: '600' }}>Taux: {stats.winRateText}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px', color: '#f97316' }}>
                            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                          </svg>
                          <span style={{ color: '#667eea', fontWeight: '600' }}>{stats.tournamentsText}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="dropdown-divider" style={{ height: '1px', background: '#e2e8f0', margin: '0' }}></div>
                  
                  {/* Menu items fonctionnels */}
                  <div className="dropdown-items" style={{ padding: '0.5rem 0' }}>
                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('game')}
                      disabled={isCreatingGame}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: isCreatingGame ? '#a0aec0' : '#4a5568',
                        cursor: isCreatingGame ? 'wait' : 'pointer',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                        opacity: isCreatingGame ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => !isCreatingGame && (e.currentTarget.style.background = '#f7fafc')}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path d="M21.58 16.09l-1.09-7.66A3.996 3.996 0 0016.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                      </svg>
                      <span>{isCreatingGame ? 'Recherche...' : 'Jouer Maintenant'}</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('profile')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#4a5568',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <span>Mon Profil</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('tournaments')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#4a5568',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"/>
                      </svg>
                      <span>Mes Tournois</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('friends')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#4a5568',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                      </svg>
                      <span>Mes Amis & Défis</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('chat')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#4a5568',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                      </svg>
                      <span>Messages</span>
                    </button>

                    <button
                      className="dropdown-item"
                      onClick={() => handleDropdownItemClick('settings')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#4a5568',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                      <span>Paramètres</span>
                    </button>

                    <div className="dropdown-divider" style={{ height: '1px', background: '#e2e8f0', margin: '0.25rem 0' }}></div>

                    <button
                      className="dropdown-item logout"
                      onClick={() => handleDropdownItemClick('logout')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#e53e3e',
                        cursor: 'pointer',
                        fontSize: '0.95rem',
                        textAlign: 'left',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(229, 62, 62, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <svg className="dropdown-icon" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', color: '#e53e3e' }}>
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                      </svg>
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="login-button"
              onClick={() => navigate('/login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 1.25rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#5a67d8'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <span>Se connecter</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;