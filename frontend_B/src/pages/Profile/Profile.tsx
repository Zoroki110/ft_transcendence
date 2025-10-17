// frontend_B/src/pages/Profile/Profile.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { userAPI } from '../../services/api';
import MatchHistory from '../../components/MatchHistory/MatchHistory';
import './Profile.css';

interface UserStats {
  id: number;
  username: string;
  gamesWon: number;
  gamesLost: number;
  totalGames: number;
  winRate: number;
  tournamentsWon: number;
  totalScore: number;
}

interface ProfileUser {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isOnline?: boolean;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { id: profileUserId } = useParams<{ id?: string }>();
  const { user: currentUser, loadProfile } = useUser();
  
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  // Déterminer si c'est mon profil ou celui d'un autre
  const isMyProfile = !profileUserId || (currentUser && profileUserId === currentUser.id.toString());
  const targetUserId = isMyProfile ? currentUser?.id : parseInt(profileUserId || '0');

  // Fonction pour charger les données du profil et les stats
  const loadUserData = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`🔄 PROFILE: Chargement données pour userId=${userId}, isMyProfile=${isMyProfile}`);
      
      // Charger les données utilisateur et stats en parallèle
      const [userResponse, statsResponse] = await Promise.all([
        isMyProfile ? userAPI.getMyProfile() : userAPI.getUserProfile(userId),
        isMyProfile ? userAPI.getMyStats() : userAPI.getUserStats(userId)
      ]);
      
      console.log('👤 PROFILE: Données utilisateur:', userResponse.data);
      console.log('📊 PROFILE: Statistiques:', statsResponse.data);
      
      setProfileUser(userResponse.data);
      setUserStats(statsResponse.data);
      setLastUpdateTime(new Date().toLocaleTimeString());

      // Vérifier si l'utilisateur est déjà ami (seulement si ce n'est pas mon profil)
      if (!isMyProfile && currentUser) {
        try {
          const friendsResponse = await userAPI.getMyFriends();
          const friends = friendsResponse.data;
          const isAlreadyFriend = friends.some((friend: any) => friend.id === userId);
          setIsFriend(isAlreadyFriend);
        } catch (err) {
          console.error('Erreur lors de la vérification des amis:', err);
        }
      }

    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de chargement du profil';
      setError(message);
      console.error('❌ PROFILE: Erreur:', message);
    } finally {
      setIsLoading(false);
    }
  }, [isMyProfile, currentUser]);
  
  // Charger les données au montage et quand l'utilisateur change
  useEffect(() => {
    if (!targetUserId) {
      if (!currentUser) {
        loadProfile(); // Charger mon profil si pas connecté
      }
      return;
    }
    
    loadUserData(targetUserId);
  }, [targetUserId, currentUser, loadUserData, loadProfile]);
  
  // Actualiser automatiquement les stats toutes les 10 secondes si c'est mon profil
  useEffect(() => {
    if (!isMyProfile || !targetUserId) return;
    
    const interval = setInterval(() => {
      console.log('🔄 PROFILE: Actualisation automatique des stats');
      loadUserData(targetUserId);
    }, 10000); // 10 secondes
    
    return () => clearInterval(interval);
  }, [isMyProfile, targetUserId, loadUserData]);
  
  // Actualiser quand on revient sur la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && targetUserId) {
        console.log('🔄 PROFILE: Page redevenue visible - actualisation');
        loadUserData(targetUserId);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [targetUserId, loadUserData]);
  
  // Fonction pour envoyer une demande d'ami
  const handleAddFriend = async () => {
    if (!targetUserId) return;

    try {
      await userAPI.sendFriendRequest(targetUserId);
      setFriendRequestSent(true);
      alert('Demande d\'ami envoyée !');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi de la demande d\'ami');
    }
  };

  // Fonction pour forcer le rechargement
  const handleRefresh = useCallback(() => {
    if (targetUserId) {
      loadUserData(targetUserId);
    }
  }, [targetUserId, loadUserData]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading && !profileUser) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div className="profile-error">
        <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="error-message">{error}</p>
        <button onClick={handleRefresh} className="btn btn-primary">
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Réessayer
        </button>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-error">
        <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p className="error-message">Profil introuvable</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="container">
          <div className="profile-header-content">
            <div className="profile-avatar-large">
              {profileUser.avatar ? (
                <span className="avatar-emoji">{profileUser.avatar}</span>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            <div className="profile-header-info">
              <h1 className="page-title">
                {profileUser.displayName || profileUser.username}
                {profileUser.isOnline && <span className="online-badge">En ligne</span>}
              </h1>
              <p className="page-subtitle">@{profileUser.username}</p>
              {!isMyProfile && (
                <span className="profile-badge">
                  <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Profil public
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid grid-2">

          <div className="card">
            <div className="section-header">
              <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="profile-section-title">Informations personnelles</h2>
            </div>

            <div className="profile-info-list">
              <div className="profile-info-item">
                <div className="info-label">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Nom d'utilisateur
                </div>
                <span className="profile-info-value">{profileUser.username}</span>
              </div>

              {isMyProfile && profileUser.email && (
                <div className="profile-info-item">
                  <div className="info-label">
                    <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </div>
                  <span className="profile-info-value">{profileUser.email}</span>
                </div>
              )}

              <div className="profile-info-item">
                <div className="info-label">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Nom d'affichage
                </div>
                <span className="profile-info-value">
                  {profileUser.displayName || 'Non défini'}
                </span>
              </div>

              <div className="profile-info-item">
                <div className="info-label">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Avatar
                </div>
                <span className="profile-avatar-display">{profileUser.avatar || '👤'}</span>
              </div>

              <div className="profile-info-item profile-info-item-divider">
                <div className="info-label">
                  <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Membre depuis
                </div>
                <span className="profile-info-value">
                  {formatDate(profileUser.createdAt)}
                </span>
              </div>
            </div>

            <div className="profile-actions">
              {isMyProfile ? (
                <button
                  onClick={() => navigate('/settings')}
                  className="btn btn-primary btn-full"
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Modifier le profil
                </button>
              ) : (
                <div className="profile-public-actions">
                  <button
                    onClick={() => navigate(`/game/challenge/${profileUser.id}`)}
                    className="btn btn-secondary"
                  >
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Défier en duel
                  </button>
                  {!isFriend && (
                    <button
                      onClick={handleAddFriend}
                      className="btn btn-primary"
                      disabled={friendRequestSent}
                    >
                      <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {friendRequestSent ? 'Demande envoyée' : 'Ajouter ami'}
                    </button>
                  )}
                  {isFriend && (
                    <div className="friend-badge">
                      <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ami
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="profile-section-title">
                Statistiques {!isMyProfile && `de ${profileUser.username}`}
              </h2>
            </div>

            {isLoading && !userStats ? (
              <div className="profile-stats-placeholder">
                <div className="loading-spinner"></div>
                <p>Chargement des statistiques...</p>
              </div>
            ) : userStats ? (
              <div className="profile-stats-container">
                <div className="profile-stats-grid">
                  <div className="profile-stat-item stat-wins">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <div className="profile-stat-value">{userStats.gamesWon || 0}</div>
                    <div className="profile-stat-label">Victoires</div>
                  </div>
                  <div className="profile-stat-item stat-losses">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div className="profile-stat-value">{userStats.gamesLost || 0}</div>
                    <div className="profile-stat-label">Défaites</div>
                  </div>
                  <div className="profile-stat-item stat-total">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="profile-stat-value">{userStats.totalGames || 0}</div>
                    <div className="profile-stat-label">Total Parties</div>
                  </div>
                  <div className="profile-stat-item stat-winrate">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <div className="profile-stat-value">{(userStats.winRate || 0).toFixed(1)}%</div>
                    <div className="profile-stat-label">Taux de Victoire</div>
                  </div>
                  <div className="profile-stat-item stat-tournaments">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    <div className="profile-stat-value">{userStats.tournamentsWon || 0}</div>
                    <div className="profile-stat-label">Tournois Gagnés</div>
                  </div>
                  <div className="profile-stat-item stat-score">
                    <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <div className="profile-stat-value">{userStats.totalScore || 0}</div>
                    <div className="profile-stat-label">Score Total</div>
                  </div>
                </div>
                
                <div className="profile-stats-analysis">
                  {userStats.totalGames > 0 ? (
                    <div className="stats-insights">
                      <div className="insight-item">
                        <svg className="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span><strong>Niveau :</strong> {getRankFromWinRate(userStats.winRate)}</span>
                      </div>
                      <div className="insight-item">
                        <svg className="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span><strong>Expérience :</strong> {getExperienceLevel(userStats.totalGames)}</span>
                      </div>
                      {userStats.winRate > 70 && (
                        <div className="stat-highlight">
                          <svg className="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          Excellent joueur !
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="stats-nodata">
                      <svg className="nodata-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Aucune partie jouée pour le moment
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="profile-stats-placeholder">
                <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Aucune statistique disponible</p>
                <p className="placeholder-info">
                  {isMyProfile ? 'Jouez des parties pour voir vos statistiques !' : 'Cet utilisateur n\'a pas encore de statistiques.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card profile-quick-actions">
          <div className="section-header">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h2 className="profile-section-title">Actions rapides</h2>
          </div>
          <div className="profile-actions-grid">
            <button
              onClick={() => navigate('/tournaments')}
              className="btn btn-secondary"
            >
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Voir les tournois
            </button>
            <button
              onClick={() => navigate('/game')}
              className="btn btn-secondary"
            >
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Jouer une partie
            </button>
            {isMyProfile && (
              <button
                onClick={() => navigate('/settings')}
                className="btn btn-secondary"
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramètres
              </button>
            )}
            {!isMyProfile && (
              <button
                onClick={() => navigate(`/users/${profileUser.id}/matches`)}
                className="btn btn-secondary"
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Historique des parties
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h2 className="profile-section-title">
              Historique des matchs {!isMyProfile && `de ${profileUser.username}`}
            </h2>
          </div>
          <MatchHistory
            userId={targetUserId}
            isMyProfile={isMyProfile}
            limit={10}
          />
        </div>
      </div>
    </div>
  );
};

// Fonctions utilitaires pour l'analyse des stats
function getRankFromWinRate(winRate: number): string {
  if (winRate >= 80) return 'Master';
  if (winRate >= 60) return 'Expert';
  if (winRate >= 40) return 'Avancé';
  if (winRate >= 20) return 'Intermédiaire';
  return 'Débutant';
}

function getExperienceLevel(totalGames: number): string {
  if (totalGames >= 100) return 'Vétéran';
  if (totalGames >= 50) return 'Expérimenté';
  if (totalGames >= 20) return 'Habitué';
  if (totalGames >= 5) return 'Novice';
  return 'Débutant';
}

export default Profile;