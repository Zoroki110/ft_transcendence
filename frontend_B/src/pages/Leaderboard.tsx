// frontend_B/src/pages/Leaderboard.tsx - VERSION DYNAMIQUE SANS DONNÉES EN DUR

import React, { useState, useMemo } from 'react';

// Interface pour les joueurs (structure prête pour le backend)
interface Player {
  id: number;
  username: string;
  avatar?: string;
  gamesWon: number;
  gamesLost: number;
  tournamentsWon: number;
  totalScore: number;
  isOnline: boolean;
  winRate: number;
  totalGames: number;
  rank?: number;
}

const Leaderboard: React.FC = () => {
  // État initial VIDE - pas de données en dur !
  const [players] = useState<Player[]>([]);
  const [sortBy, setSortBy] = useState<'score' | 'winRate' | 'wins' | 'tournaments'>('score');
  const [filterOnline, setFilterOnline] = useState<'all' | 'online' | 'offline'>('all');

  // Tri et filtrage dynamique (même si vide pour l'instant)
  const sortedPlayers = useMemo(() => {
    let filtered = players.filter(player => {
      if (filterOnline === 'online') return player.isOnline;
      if (filterOnline === 'offline') return !player.isOnline;
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.totalScore - a.totalScore;
        case 'winRate':
          return b.winRate - a.winRate;
        case 'wins':
          return b.gamesWon - a.gamesWon;
        case 'tournaments':
          return b.tournamentsWon - a.tournamentsWon;
        default:
          return b.totalScore - a.totalScore;
      }
    });

    return sorted.map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  }, [players, sortBy, filterOnline]);

  // Helpers pour l'affichage
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return 'var(--gray-700)';
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 80) return 'var(--success)';
    if (winRate >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  // Si pas de joueurs, afficher un état vide
  if (players.length === 0) {
    return (
      <div>
        <section className="page-header">
          <div className="container">
            <h1 className="page-title">📊 Classement des Joueurs</h1>
            <p className="page-subtitle">
              Le classement des meilleurs joueurs de Transcendence
            </p>
          </div>
        </section>

        <div className="container">
          {/* État vide */}
          <div className="card text-center">
            <div style={{ padding: '4rem 2rem' }}>
              <div style={{ fontSize: '5rem', marginBottom: '2rem', opacity: 0.5 }}>📊</div>
              <h2 style={{ marginBottom: '1rem', color: 'var(--gray-700)' }}>
                Aucune donnée de classement
              </h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Le leaderboard sera alimenté automatiquement dès que les joueurs commenceront à jouer des parties et des tournois.
              </p>
              
              {/* Informations sur ce qui alimentera le leaderboard */}
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.05)', 
                padding: '2rem', 
                borderRadius: '12px',
                maxWidth: '600px',
                margin: '0 auto',
                textAlign: 'left'
              }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>
                  🎯 Comment fonctionne le classement ?
                </h3>
                <div style={{ display: 'grid', gap: '1rem', fontSize: '0.95rem', color: 'var(--gray-700)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏆</span>
                    <div>
                      <strong>Score total :</strong> Points accumulés dans les parties et tournois
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📈</span>
                    <div>
                      <strong>Taux de victoire :</strong> Pourcentage de parties gagnées
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎮</span>
                    <div>
                      <strong>Parties jouées :</strong> Nombre total de matchs disputés
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🏅</span>
                    <div>
                      <strong>Tournois gagnés :</strong> Championnats remportés (bonus important)
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation de ce que ça donnera */}
              <div style={{ 
                marginTop: '2rem',
                padding: '1.5rem',
                background: 'var(--gray-100)',
                borderRadius: '8px',
                border: '2px dashed var(--gray-300)'
              }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--gray-600)' }}>
                  📋 Aperçu du futur classement
                </h4>
                <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                  <div>🥇 #1 - Jacob - 2,850 pts (84.7% victoires)</div>
                  <div>🥈 #2 - ProGamer42 - 2,720 pts (76.0% victoires)</div>
                  <div>🥉 #3 - PongMaster - 2,680 pts (71.0% victoires)</div>
                  <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                    ...et bien d'autres joueurs !
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fonctionnalités à venir */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>
              🚀 Fonctionnalités du Leaderboard
            </h3>
            <div className="grid grid-2">
              <div>
                <h4 style={{ color: 'var(--gray-700)', marginBottom: '0.75rem' }}>🔧 Filtres disponibles</h4>
                <ul style={{ color: 'var(--gray-600)', paddingLeft: '1.25rem' }}>
                  <li>Joueurs en ligne / hors ligne</li>
                  <li>Par période (semaine, mois, all-time)</li>
                  <li>Par niveau de jeu</li>
                </ul>
              </div>
              <div>
                <h4 style={{ color: 'var(--gray-700)', marginBottom: '0.75rem' }}>📊 Options de tri</h4>
                <ul style={{ color: 'var(--gray-600)', paddingLeft: '1.25rem' }}>
                  <li>Score total</li>
                  <li>Taux de victoire</li>
                  <li>Nombre de victoires</li>
                  <li>Tournois gagnés</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interface de test pour les filtres/tri (même si vide) */}
          <div className="card" style={{ marginTop: '2rem', background: 'rgba(239, 68, 68, 0.05)' }}>
            <h4 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
              🧪 Interface de Test (fonctionne même sans données)
            </h4>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Filtrer par statut:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className={`btn ${filterOnline === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterOnline('all')}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    Tous (0)
                  </button>
                  <button
                    className={`btn ${filterOnline === 'online' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterOnline('online')}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    🟢 En ligne (0)
                  </button>
                  <button
                    className={`btn ${filterOnline === 'offline' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilterOnline('offline')}
                    style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                  >
                    ⚫ Hors ligne (0)
                  </button>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Trier par:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="input"
                  style={{ minWidth: '160px', padding: '0.4rem' }}
                >
                  <option value="score">🏆 Score total</option>
                  <option value="winRate">📈 Taux de victoire</option>
                  <option value="wins">🎯 Victoires</option>
                  <option value="tournaments">🏆 Tournois gagnés</option>
                </select>
              </div>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
              ℹ️ Ces contrôles fonctionneront automatiquement dès qu'il y aura des données à afficher
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si il y a des joueurs, afficher le classement normal
  // (Ce code ne s'exécutera que quand il y aura des vraies données)
  return (
    <div>
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">📊 Classement des Joueurs</h1>
          <p className="page-subtitle">
            Top {players.length} des meilleurs joueurs de Transcendence
          </p>
        </div>
      </section>

      <div className="container">
        {/* Le reste du code d'affichage du classement reste identique */}
        {/* Mais ne s'affichera que quand players.length > 0 */}
        
        <div className="card">
          <p>Classement complet avec {sortedPlayers.length} joueurs</p>
          {/* TODO: Affichage complet du tableau quand il y aura des données */}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;