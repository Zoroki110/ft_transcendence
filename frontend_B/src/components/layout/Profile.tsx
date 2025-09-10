import React, { useState } from 'react';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings'>('profile');
  
  const userProfile = {
    username: "Jacob",
    email: "jacob@ecole42.fr",
    joinDate: "2024-12-15",
    totalGames: 70,
    wins: 42,
    losses: 28,
    winRate: 60,
    ranking: 247,
    points: 1247,
    achievements: [
      { id: 1, name: "Premier sang", description: "Première victoire", icon: "🏆", earned: true },
      { id: 2, name: "Série gagnante", description: "5 victoires consécutives", icon: "🔥", earned: true },
      { id: 3, name: "Maître Pong", description: "50 victoires", icon: "👑", earned: false },
      { id: 4, name: "Invincible", description: "10 victoires d'affilée", icon: "⚡", earned: false }
    ]
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="profile-avatar-large">
          <span>JD</span>
        </div>
        <div className="profile-info">
          <h1>{userProfile.username}</h1>
          <p>Rang #{userProfile.ranking} • {userProfile.points} points</p>
          <p>Membre depuis {new Date(userProfile.joinDate).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      <div className="container">
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profil
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistiques
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Paramètres
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'profile' && (
            <div className="profile-overview">
              <div className="overview-section">
                <h2>Informations générales</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nom d'utilisateur</label>
                    <span>{userProfile.username}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{userProfile.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Rang actuel</label>
                    <span>#{userProfile.ranking}</span>
                  </div>
                  <div className="info-item">
                    <label>Points totaux</label>
                    <span>{userProfile.points}</span>
                  </div>
                </div>
              </div>

              <div className="overview-section">
                <h2>Succès</h2>
                <div className="achievements-grid">
                  {userProfile.achievements.map(achievement => (
                    <div 
                      key={achievement.id} 
                      className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
                    >
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-info">
                        <h4>{achievement.name}</h4>
                        <p>{achievement.description}</p>
                      </div>
                      {achievement.earned && <div className="earned-badge">✓</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-overview">
              <div className="stats-summary">
                <div className="stat-card">
                  <div className="stat-number">{userProfile.totalGames}</div>
                  <div className="stat-label">Parties jouées</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{userProfile.wins}</div>
                  <div className="stat-label">Victoires</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{userProfile.losses}</div>
                  <div className="stat-label">Défaites</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{userProfile.winRate}%</div>
                  <div className="stat-label">Taux de victoire</div>
                </div>
              </div>

              <div className="stats-charts">
                <div className="chart-section">
                  <h3>Progression récente</h3>
                  <div className="chart-placeholder">
                    <p>Graphique de progression (à implémenter)</p>
                  </div>
                </div>
                
                <div className="recent-matches">
                  <h3>Dernières parties</h3>
                  <div className="matches-list">
                    <div className="match-item win">
                      <span className="match-result">V</span>
                      <span className="match-opponent">Adversaire123</span>
                      <span className="match-score">11-7</span>
                      <span className="match-date">Il y a 2h</span>
                    </div>
                    <div className="match-item win">
                      <span className="match-result">V</span>
                      <span className="match-opponent">PongMaster</span>
                      <span className="match-score">11-9</span>
                      <span className="match-date">Hier</span>
                    </div>
                    <div className="match-item loss">
                      <span className="match-result">D</span>
                      <span className="match-opponent">Champion42</span>
                      <span className="match-score">8-11</span>
                      <span className="match-date">Il y a 2 jours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-overview">
              <div className="settings-section">
                <h2>Préférences de jeu</h2>
                <div className="setting-item">
                  <label>Difficulté par défaut</label>
                  <select>
                    <option>Facile</option>
                    <option selected>Normale</option>
                    <option>Difficile</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Notifications</label>
                  <div className="checkbox-group">
                    <label className="checkbox-item">
                      <input type="checkbox" checked />
                      Invitations à jouer
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" checked />
                      Tournois
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" />
                      Messages privés
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h2>Compte</h2>
                <div className="setting-item">
                  <button className="settings-btn secondary">
                    Changer le mot de passe
                  </button>
                </div>
                <div className="setting-item">
                  <button className="settings-btn secondary">
                    Changer l'email
                  </button>
                </div>
                <div className="setting-item">
                  <button className="settings-btn danger">
                    Supprimer le compte
                  </button>
                </div>
              </div>

              <div className="settings-section">
                <h2>Préférences d'affichage</h2>
                <div className="setting-item">
                  <label>Thème</label>
                  <select>
                    <option selected>Clair</option>
                    <option>Sombre</option>
                    <option>Automatique</option>
                  </select>
                </div>
                <div className="setting-item">
                  <label>Langue</label>
                  <select>
                    <option selected>Français</option>
                    <option>English</option>
                    <option>Español</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <h2>Confidentialité</h2>
                <div className="setting-item">
                  <label>Profil visible</label>
                  <div className="checkbox-group">
                    <label className="checkbox-item">
                      <input type="checkbox" checked />
                      Permettre aux autres de voir mon profil
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" checked />
                      Afficher mes statistiques publiquement
                    </label>
                    <label className="checkbox-item">
                      <input type="checkbox" />
                      Permettre les invitations de joueurs inconnus
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;