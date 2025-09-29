// frontend_B/src/pages/Profile/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import './Profile.css';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getProfile();
        setProfile(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (error || !profile) {
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
              {profile.avatar || '😀'}
            </div>
            <div className="profile-header-info">
              <h1 className="page-title">{profile.displayName || profile.username}</h1>
              <p className="page-subtitle">@{profile.username}</p>
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
                <span className="profile-info-value">{profile.username}</span>
              </div>
              
              <div className="profile-info-item">
                <strong>✉️ Email :</strong><br />
                <span className="profile-info-value">{profile.email}</span>
              </div>
              
              <div className="profile-info-item">
                <strong>🏷️ Nom d'affichage :</strong><br />
                <span className="profile-info-value">
                  {profile.displayName || 'Non défini'}
                </span>
              </div>
              
              <div className="profile-info-item">
                <strong>😀 Avatar :</strong><br />
                <span className="profile-avatar-display">{profile.avatar || '😀'}</span>
              </div>
              
              <div className="profile-info-item profile-info-item-divider">
                <strong>📅 Membre depuis :</strong><br />
                <span className="profile-info-value">
                  {formatDate(profile.createdAt)}
                </span>
              </div>
              
              <div className="profile-info-item">
                <strong>🔄 Dernière mise à jour :</strong><br />
                <span className="profile-info-value">
                  {formatDate(profile.updatedAt)}
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
            
            <div className="profile-stats-placeholder">
              <div className="placeholder-icon">📊</div>
              <p>Les statistiques seront disponibles prochainement</p>
              <p className="placeholder-info">
                Endpoint /users/me/stats à implémenter dans le backend
              </p>
            </div>
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