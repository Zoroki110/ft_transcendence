// frontend_B/src/pages/Profile/Profile.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { userAPI } from '../../services/api';
import DebugStorage from '../../components/DebugStorage';
import TabSyncDebugger from '../../components/TabSyncDebugger';
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
        <div className="loading-icon">⏳</div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div className="profile-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error}</p>
        <button onClick={handleRefresh} className="btn btn-primary">
          🔄 Réessayer
        </button>
      </div>
    );
  }
  
  if (!profileUser) {
    return (
      <div className="profile-error">
        <div className="error-icon">👤</div>
        <p className="error-message">Profil introuvable</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          🏠 Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <DebugStorage />
      <TabSyncDebugger />
      <div className="page-header">
        <div className="container">
          <div className="profile-header-content">
            <div className="profile-avatar-large">
              {profileUser.avatar || '😀'}
            </div>
            <div className="profile-header-info">
              <h1 className="page-title">
                {profileUser.displayName || profileUser.username}
                {profileUser.isOnline && <span className="online-indicator">🟢</span>}
              </h1>
              <p className="page-subtitle">@{profileUser.username}</p>
              {!isMyProfile && (
                <p className="profile-type">👤 Profil public</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid grid-2">
          
          <div className="card">
            <h2 className="profile-section-title">👤 Informations</h2>
            
            <div className="profile-info-list">
              <div className="profile-info-item">
                <strong>👤 Nom d'utilisateur :</strong><br />
                <span className="profile-info-value">{profileUser.username}</span>
              </div>
              
              {isMyProfile && profileUser.email && (
                <div className="profile-info-item">
                  <strong>✉️ Email :</strong><br />
                  <span className="profile-info-value">{profileUser.email}</span>
                </div>
              )}
              
              <div className="profile-info-item">
                <strong>🏷️ Nom d'affichage :</strong><br />
                <span className="profile-info-value">
                  {profileUser.displayName || 'Non défini'}
                </span>
              </div>
              
              <div className="profile-info-item">
                <strong>😀 Avatar :</strong><br />
                <span className="profile-avatar-display">{profileUser.avatar || '😀'}</span>
              </div>
              
              <div className="profile-info-item profile-info-item-divider">
                <strong>📅 Membre depuis :</strong><br />
                <span className="profile-info-value">
                  {formatDate(profileUser.createdAt)}
                </span>
              </div>
              
              <div className="profile-info-item">
                <strong>🔄 Dernière mise à jour :</strong><br />
                <span className="profile-info-value">
                  {formatDate(profileUser.updatedAt)}
                </span>
              </div>
              
              {lastUpdateTime && (
                <div className="profile-info-item">
                  <strong>📊 Stats mises à jour :</strong><br />
                  <span className="profile-info-value text-small">
                    {lastUpdateTime}
                  </span>
                </div>
              )}
            </div>

            <div className="profile-actions">
              {isMyProfile ? (
                <button 
                  onClick={() => navigate('/settings')}
                  className="btn btn-primary btn-full"
                >
                  ⚙️ Modifier le profil
                </button>
              ) : (
                <div className="profile-public-actions">
                  <button
                    onClick={() => navigate(`/game/challenge/${profileUser.id}`)}
                    className="btn btn-secondary"
                  >
                    🎮 Défier en duel
                  </button>
                  {!isFriend && (
                    <button
                      onClick={handleAddFriend}
                      className="btn btn-primary"
                      disabled={friendRequestSent}
                    >
                      {friendRequestSent ? '✓ Demande envoyée' : '👤 Ajouter ami'}
                    </button>
                  )}
                  {isFriend && (
                    <div className="friend-badge">
                      ✓ Ami
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="profile-section-header">
              <h2 className="profile-section-title">
                📊 Statistiques {!isMyProfile && `de ${profileUser.username}`}
              </h2>
              <div className="profile-section-actions">
                {isMyProfile && (
                  <span className="auto-refresh-indicator">🔄 Auto-actualisation</span>
                )}
                <button
                  onClick={handleRefresh}
                  className="btn btn-small btn-secondary"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳' : '🔄'} Actualiser
                </button>
              </div>
            </div>

            {isLoading && !userStats ? (
              <div className="profile-stats-placeholder">
                <div className="placeholder-icon">⏳</div>
                <p>Chargement des statistiques...</p>
              </div>
            ) : userStats ? (
              <div className="profile-stats-container">
                <div className="profile-stats-header">
                  <span className="stats-user-info">
                    👤 {userStats.username} (ID: {userStats.id})
                  </span>
                  {isLoading && (
                    <span className="stats-updating">⏳ Mise à jour...</span>
                  )}
                </div>
                
                <div className="profile-stats-grid">
                  <div className="profile-stat-item stat-wins">
                    <div className="profile-stat-value">{userStats.gamesWon || 0}</div>
                    <div className="profile-stat-label">🏆 Victoires</div>
                  </div>
                  <div className="profile-stat-item stat-losses">
                    <div className="profile-stat-value">{userStats.gamesLost || 0}</div>
                    <div className="profile-stat-label">❌ Défaites</div>
                  </div>
                  <div className="profile-stat-item stat-total">
                    <div className="profile-stat-value">{userStats.totalGames || 0}</div>
                    <div className="profile-stat-label">🎮 Total Parties</div>
                  </div>
                  <div className="profile-stat-item stat-winrate">
                    <div className="profile-stat-value">{(userStats.winRate || 0).toFixed(1)}%</div>
                    <div className="profile-stat-label">📈 Taux de Victoire</div>
                  </div>
                  <div className="profile-stat-item stat-tournaments">
                    <div className="profile-stat-value">{userStats.tournamentsWon || 0}</div>
                    <div className="profile-stat-label">🏆 Tournois Gagnés</div>
                  </div>
                  <div className="profile-stat-item stat-score">
                    <div className="profile-stat-value">{userStats.totalScore || 0}</div>
                    <div className="profile-stat-label">⭐ Score Total</div>
                  </div>
                </div>
                
                <div className="profile-stats-analysis">
                  {userStats.totalGames > 0 ? (
                    <div className="stats-insights">
                      <p>🎯 <strong>Niveau :</strong> {getRankFromWinRate(userStats.winRate)}</p>
                      <p>🎮 <strong>Expérience :</strong> {getExperienceLevel(userStats.totalGames)}</p>
                      {userStats.winRate > 70 && (
                        <p className="stat-highlight">🌟 Excellent joueur !</p>
                      )}
                    </div>
                  ) : (
                    <p className="stats-nodata">📝 Aucune partie jouée pour le moment</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="profile-stats-placeholder">
                <div className="placeholder-icon">📊</div>
                <p>Aucune statistique disponible</p>
                <p className="placeholder-info">
                  {isMyProfile ? 'Jouez des parties pour voir vos statistiques !' : 'Cet utilisateur n\'a pas encore de statistiques.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card profile-quick-actions">
          <h2 className="profile-section-title">⚡ Actions rapides</h2>
          <div className="profile-actions-grid">
            <button 
              onClick={() => navigate('/tournaments')}
              className="btn btn-secondary"
            >
              🏆 Voir les tournois
            </button>
            <button 
              onClick={() => navigate('/game')}
              className="btn btn-secondary"
            >
              🎮 Jouer une partie
            </button>
            {isMyProfile && (
              <button 
                onClick={() => navigate('/settings')}
                className="btn btn-secondary"
              >
                ⚙️ Paramètres
              </button>
            )}
            {!isMyProfile && (
              <button 
                onClick={() => navigate(`/users/${profileUser.id}/matches`)}
                className="btn btn-secondary"
              >
                📊 Historique des parties
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonctions utilitaires pour l'analyse des stats
function getRankFromWinRate(winRate: number): string {
  if (winRate >= 80) return 'Master 🏆';
  if (winRate >= 60) return 'Expert 🥇';
  if (winRate >= 40) return 'Avancé 🥈';
  if (winRate >= 20) return 'Intermédiaire 🥉';
  return 'Débutant 🌱';
}

function getExperienceLevel(totalGames: number): string {
  if (totalGames >= 100) return 'Vétéran 🎖️';
  if (totalGames >= 50) return 'Expérimenté 🎯';
  if (totalGames >= 20) return 'Habitué 🎮';
  if (totalGames >= 5) return 'Novice 🌟';
  return 'Débutant 🐣';
}

export default Profile;