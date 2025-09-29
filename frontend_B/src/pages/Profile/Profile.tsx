// frontend_B/src/pages/Profile/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { userAPI } from '../../services/api';
import './Profile.css';

interface UserStats {
  gamesWon: number;
  gamesLost: number;
  totalGames: number;
  winRate: number;
  tournamentsWon: number;
  totalScore: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, stats, loading: userLoading, loadProfile } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localStats, setLocalStats] = useState<UserStats | null>(null);

  // Charger le profil une seule fois au montage
  useEffect(() => {
    if (!user) {
      loadProfile();
    }
  }, []); // Tableau de dépendances vide = une seule fois

  // Charger les stats quand user est disponible
  useEffect(() => {
    if (user) {
      const loadStats = async () => {
        try {
          setIsLoading(true);
          const response = await userAPI.getMyStats();
          setLocalStats(response.data);
        } catch (err: any) {
          console.log('Stats not available yet:', err.response?.data?.message);
        } finally {
          setIsLoading(false);
        }
      };
      loadStats();
    }
  }, [user]); // Se déclenche quand user change

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (userLoading || isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error || 'Profil introuvable'}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="container">
          <div className="profile-header-content">
            <div className="profile-avatar-large">
              {user.avatar || '😀'}
            </div>
            <div className="profile-header-info">
              <h1 className="page-title">{user.displayName || user.username}</h1>
              <p className="page-subtitle">@{user.username}</p>
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
                <span className="profile-info-value">{user.username}</span>
              </div>
              
              <div className="profile-info-item">
                <strong>✉️ Email :</strong><br />
                <span className="profile-info-value">{user.email}</span>
              </div>
              
              <div className="profile-info-item">
                <strong>🏷️ Nom d'affichage :</strong><br />
                <span className="profile-info-value">
                  {user.displayName || 'Non défini'}
                </span>
              </div>
              
              <div className="profile-info-item">
                <strong>😀 Avatar :</strong><br />
                <span className="profile-avatar-display">{user.avatar || '😀'}</span>
              </div>
              
              <div className="profile-info-item profile-info-item-divider">
                <strong>📅 Membre depuis :</strong><br />
                <span className="profile-info-value">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              
              <div className="profile-info-item">
                <strong>🔄 Dernière mise à jour :</strong><br />
                <span className="profile-info-value">
                  {formatDate(user.updatedAt)}
                </span>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                onClick={() => navigate('/settings')}
                className="btn btn-primary btn-full"
              >
                ⚙️ Modifier le profil
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="profile-section-title">📊 Statistiques</h2>
            
            {user ? (
              <div className="profile-stats-grid">
                <div className="profile-stat-item">
                  <div className="profile-stat-value">{user.gamesWon || 0}</div>
                  <div className="profile-stat-label">🏆 Victoires</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-value">{user.gamesLost || 0}</div>
                  <div className="profile-stat-label">❌ Défaites</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-value">{user.totalGames || 0}</div>
                  <div className="profile-stat-label">🎮 Total Parties</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-value">{(user.winRate || 0).toFixed(1)}%</div>
                  <div className="profile-stat-label">📈 Taux de Victoire</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-value">{user.tournamentsWon || 0}</div>
                  <div className="profile-stat-label">🏆 Tournois Gagnés</div>
                </div>
                <div className="profile-stat-item">
                  <div className="profile-stat-value">{user.totalScore || 0}</div>
                  <div className="profile-stat-label">⭐ Score Total</div>
                </div>
              </div>
            ) : (
              <div className="profile-stats-placeholder">
                <div className="placeholder-icon">📊</div>
                <p>Aucune statistique disponible</p>
                <p className="placeholder-info">
                  Jouez des parties pour voir vos statistiques !
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
              onClick={() => navigate('/settings')}
              className="btn btn-secondary"
            >
              ⚙️ Paramètres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;