// frontend_B/src/pages/Settings/Settings.tsx
import React, { useState, useEffect } from 'react';
import { userAPI, authAPI } from '../../services/api';
import './Settings.css';

interface UserSettings {
  username: string;
  displayName: string;
  email: string;
  avatar: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [userId, setUserId] = useState<number | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    username: '',
    displayName: '',
    email: '',
    avatar: '😀'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const avatars = ['😀', '😎', '🎮', '🕹️', '👤', '🎯', '🏆', '⚡', '🔥', '💎'];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await userAPI.getProfile();
        setUserId(response.data.id);
        setSettings({
          username: response.data.username,
          displayName: response.data.displayName || '',
          email: response.data.email,
          avatar: response.data.avatar || '😀'
        });
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Erreur de chargement' });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsSaving(true);
    setMessage(null);

    try {
      await userAPI.updateProfile(userId, settings);
      setMessage({ type: 'success', text: 'Paramètres sauvegardés !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur de sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggle2FA = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      if (!twoFAEnabled) {
        const response = await authAPI.enable2FA();
        setQrCode(response.data.qrCode);
        setTwoFAEnabled(true);
        setMessage({ type: 'success', text: '2FA activé ! Scannez le QR code.' });
      } else {
        await authAPI.disable2FA();
        setTwoFAEnabled(false);
        setQrCode(null);
        setMessage({ type: 'success', text: '2FA désactivé.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur 2FA' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
                
                <div className={`settings-2fa-box ${twoFAEnabled ? 'enabled' : 'disabled'}`}>
                  <div className="settings-2fa-header">
                    <span className="settings-2fa-icon">{twoFAEnabled ? '🔒' : '🔓'}</span>
                    <div>
                      <div className="settings-2fa-title">
                        2FA {twoFAEnabled ? 'Activé' : 'Désactivé'}
                      </div>
                      <div className="settings-2fa-description">
                        {twoFAEnabled ? 'Compte sécurisé' : 'Activez pour plus de sécurité'}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    className={`btn ${twoFAEnabled ? 'btn-danger' : 'btn-success'}`}
                    onClick={toggle2FA}
                    disabled={isSaving}
                  >
                    {isSaving ? '⏳...' : twoFAEnabled ? '❌ Désactiver' : '✅ Activer'}
                  </button>

                  {qrCode && (
                    <div className="settings-2fa-qr">
                      <p className="settings-2fa-qr-text">
                        📱 Scannez avec votre app :
                      </p>
                      <img src={qrCode} alt="QR Code 2FA" className="settings-qr-image" />
                    </div>
                  )}
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