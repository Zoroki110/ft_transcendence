// frontend_B/src/pages/Settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { userAPI, authAPI } from '../../services/api';
import { API_CONFIG } from '../../config';
import { DEFAULT_AVATARS, getAvatarById, DEFAULT_AVATAR_ID } from '../../utils/avatars';
import './Settings.css';

interface UserSettings {
  username: string;
  displayName: string;
  email: string;
  avatar: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading, updateProfile: contextUpdateProfile } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [settings, setSettings] = useState<UserSettings>({
    username: '',
    displayName: '',
    email: '',
    avatar: DEFAULT_AVATAR_ID.toString()
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      // Convertir l'ancien format d'avatar si nécessaire
      let avatarValue = user.avatar || DEFAULT_AVATAR_ID.toString();

      // Si c'est un ancien chemin /uploads/, utiliser l'avatar par défaut
      if (avatarValue.startsWith('/uploads/')) {
        avatarValue = DEFAULT_AVATAR_ID.toString();
      }

      setSettings({
        username: user.username,
        displayName: user.displayName || '',
        email: user.email,
        avatar: avatarValue
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // Utiliser la méthode du contexte pour mettre à jour le profil
      const success = await contextUpdateProfile({
        username: settings.username,
        email: settings.email,
        displayName: settings.displayName || null,
        avatar: settings.avatar // Inclure l'avatar sélectionné
      });

      if (success) {
        setMessage({ type: 'success', text: 'Paramètres sauvegardés !' });
        // Rediriger vers le profil après 1.5 secondes
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur de sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };


  if (userLoading || !user) {
    return (
      <div className="settings-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">⚙️ Paramètres</h1>
          <p className="page-subtitle">Gérez votre compte</p>
        </div>
      </div>

      <div className="container">
        {message && (
          <div className={`settings-message settings-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-layout">
          
          <div className="card settings-nav">
            {['profile', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`settings-nav-item ${activeTab === tab ? 'active' : ''}`}
              >
                {tab === 'profile' && '👤 Profil'}
                {tab === 'security' && '🔒 Sécurité'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="settings-content">
            
            {activeTab === 'profile' && (
              <div className="card">
                <h2 className="settings-section-title">👤 Profil</h2>

                <div className="form-group">
                  <label className="form-label">Choisissez votre avatar</label>
                  <p className="form-hint">Sélectionnez un avatar parmi les options disponibles</p>
                  <div className="avatar-grid">
                    {DEFAULT_AVATARS.map(avatar => {
                      const isSelected = settings.avatar === avatar.id.toString();
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, avatar: avatar.id.toString() }))}
                          className={`avatar-option ${isSelected ? 'active' : ''}`}
                          style={{
                            backgroundColor: isSelected ? avatar.color : 'transparent',
                            border: isSelected ? `3px solid ${avatar.color}` : '2px solid #e0e0e0'
                          }}
                          title={avatar.name}
                        >
                          <span style={{ fontSize: '2rem' }}>{avatar.emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nom d'utilisateur</label>
                  <input
                    className="input"
                    value={settings.username}
                    onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nom d'affichage</label>
                  <input
                    className="input"
                    value={settings.displayName}
                    onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="input"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="card">
                <h2 className="settings-section-title">🔒 Sécurité</h2>
                
                <div className="settings-placeholder">
                  <div className="placeholder-icon">🔒</div>
                  <p>Options de sécurité</p>
                  <p className="placeholder-info">
                    Fonctionnalités à venir...
                  </p>
                </div>
              </div>
            )}

            <div className="settings-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/profile')}
              >
                🔄 Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;