// frontend_B/src/pages/Profile.tsx - PROFIL DYNAMIQUE ET FONCTIONNEL

import React, { useState } from 'react';
import { useUser, UpdateProfileData } from '../contexts/UserContext';

const Profile: React.FC = () => {
  const { user, updateProfile, simulateGameWin, simulateGameLoss, simulateTournamentWin } = useUser();
  
  // État du formulaire de modification
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    username: user?.username || '',
    email: user?.email || '',
    displayName: user?.displayName || '',
    avatar: user?.avatar || '',
  });

  if (!user) {
    return (
      <div>
        <section className="page-header">
          <div className="container">
            <h1 className="page-title">👤 Profil</h1>
            <p className="page-subtitle">Aucun utilisateur connecté</p>
          </div>
        </section>
      </div>
    );
  }

  // Gestion du formulaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: user.username,
      email: user.email,
      displayName: user.displayName || '',
      avatar: user.avatar || '',
    });
    setIsEditing(false);
  };

  // Helpers pour l'affichage
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'var(--success)';
    if (winRate >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getRankEstimation = (totalScore: number) => {
    if (totalScore >= 2500) return { rank: 'Champion', icon: '👑', color: '#FFD700' };
    if (totalScore >= 2000) return { rank: 'Expert', icon: '🥇', color: '#C0C0C0' };
    if (totalScore >= 1500) return { rank: 'Avancé', icon: '🥈', color: '#CD7F32' };
    if (totalScore >= 1000) return { rank: 'Intermédiaire', icon: '🥉', color: 'var(--warning)' };
    if (totalScore >= 500) return { rank: 'Débutant+', icon: '📈', color: 'var(--primary)' };
    return { rank: 'Novice', icon: '🌱', color: 'var(--success)' };
  };

  const userRank = getRankEstimation(user.totalScore);

  return (
    <div>
      {/* Header avec info principale */}
      <section className="page-header">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{
              fontSize: '4rem',
              width: '80px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              flexShrink: 0
            }}>
              {user.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
                {user.displayName || user.username}
              </h1>
              <p className="page-subtitle" style={{ marginBottom: '0.5rem' }}>
                @{user.username} • {user.email}
              </p>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                fontSize: '0.9rem',
                opacity: 0.9
              }}>
                <span style={{ color: userRank.color }}>
                  {userRank.icon} {userRank.rank}
                </span>
                <span>
                  {user.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                </span>
                <span>
                  📅 Membre depuis {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        
        {/* Statistiques principales */}
        <div className="grid grid-2 mb-4">
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
              📊 Statistiques de Jeu
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🏆 Score Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {user.totalScore.toLocaleString()}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎮 Parties Jouées</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {user.totalGames}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✅ Victoires</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {user.gamesWon}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>❌ Défaites</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                  {user.gamesLost}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📈 Taux de Victoire</span>
                <span style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: getWinRateColor(user.winRate)
                }}>
                  {user.totalGames > 0 ? `${user.winRate.toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              
              {/* Barre de progression du taux de victoire */}
              {user.totalGames > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ 
                    background: 'var(--gray-200)', 
                    height: '8px', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      background: getWinRateColor(user.winRate),
                      height: '100%', 
                      width: `${user.winRate}%`,
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                <span>🏅 Tournois Gagnés</span>
                <span style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  color: user.tournamentsWon > 0 ? 'var(--warning)' : 'var(--gray-500)' 
                }}>
                  {user.tournamentsWon}
                </span>
              </div>
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                ⚙️ Informations Personnelles
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                {isEditing ? '❌ Annuler' : '✏️ Modifier'}
              </button>
            </div>
            
            {isEditing ? (
              // Mode édition
              <div>
                <div className="form-group">
                  <label className="form-label">👤 Nom d'utilisateur</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Votre nom d'utilisateur"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">✉️ Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="votre@email.com"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">🏷️ Nom d'affichage</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Votre nom complet"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">😀 Avatar (emoji)</label>
                  <input
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="😀"
                    maxLength={2}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleSave}
                    className="btn btn-success"
                    style={{ flex: 1 }}
                  >
                    ✅ Sauvegarder
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    ❌ Annuler
                  </button>
                </div>
              </div>
            ) : (
              // Mode affichage
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <strong>👤 Nom d'utilisateur :</strong><br />
                  <span style={{ color: 'var(--gray-700)' }}>{user.username}</span>
                </div>
                
                <div>
                  <strong>✉️ Email :</strong><br />
                  <span style={{ color: 'var(--gray-700)' }}>{user.email}</span>
                </div>
                
                <div>
                  <strong>🏷️ Nom d'affichage :</strong><br />
                  <span style={{ color: 'var(--gray-700)' }}>
                    {user.displayName || 'Non défini'}
                  </span>
                </div>
                
                <div>
                  <strong>😀 Avatar :</strong><br />
                  <span style={{ fontSize: '2rem' }}>{user.avatar}</span>
                </div>
                
                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                  <strong>📅 Membre depuis :</strong><br />
                  <span style={{ color: 'var(--gray-700)' }}>
                    {formatDate(user.createdAt)}
                  </span>
                </div>
                
                <div>
                  <strong>⏰ Dernière activité :</strong><br />
                  <span style={{ color: 'var(--gray-700)' }}>
                    {user.lastSeen ? new Date(user.lastSeen).toLocaleString('fr-FR') : 'Inconnue'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions de test pour les stats */}
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
            🧪 Zone de Test (Simulation de Parties)
          </h3>
          <p style={{ color: 'var(--gray-700)', marginBottom: '1.5rem' }}>
            Pour tester le système de statistiques, vous pouvez simuler des parties :
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={simulateGameWin}
              className="btn btn-success"
            >
              🎉 Simuler une Victoire (+100 pts)
            </button>
            <button
              onClick={simulateGameLoss}
              className="btn btn-danger"
            >
              😢 Simuler une Défaite (-20 pts)
            </button>
            <button
              onClick={simulateTournamentWin}
              className="btn"
              style={{ background: 'var(--warning)', color: 'white' }}
            >
              🏆 Gagner un Tournoi (+500 pts)
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '1rem', fontStyle: 'italic' }}>
            ℹ️ Ces boutons permettent de tester le système de stats. Dans la vraie app, 
            ces données viendront automatiquement des parties jouées.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;