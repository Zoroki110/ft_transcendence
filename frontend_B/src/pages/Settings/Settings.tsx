// frontend_B/src/pages/Settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { userAPI, authAPI } from '../../services/api';
import './Settings.css';

interface UserSettings {
  username: string;
  displayName: string;
  email: string;
  avatar: string;
}

const Settings: React.FC = () => {
  const { user, loading: userLoading, updateProfile: contextUpdateProfile } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [settings, setSettings] = useState<UserSettings>({
    username: '',
    displayName: '',
    email: '',
    avatar: '😀'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const avatars = ['😀', '😎', '🎮', '🕹️', '👤', '🎯', '🏆', '⚡', '🔥', '💎'];

  useEffect(() => {
    if (user) {
      setSettings({
        username: user.username,
        displayName: user.displayName || '',
        email: user.email,
        avatar: user.avatar || '😀'
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
        displayName: settings.displayName || null
      });

      if (success) {
        setMessage({ type: 'success', text: 'Paramètres sauvegardés !' });
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
                  <label className="form-label">Avatar</label>
                  <div className="avatar-grid">
                    {avatars.map(avatar => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, avatar }))}
                        className={`avatar-option ${settings.avatar === avatar ? 'active' : ''}`}
                      >
                        {avatar}
                      </button>
                    ))}
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
              <button type="button" className="btn btn-secondary">
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