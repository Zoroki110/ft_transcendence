// frontend_B/src/pages/Leaderboard/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import './Leaderboard.css';

interface UserStats {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  gamesWon: number;
  gamesLost: number;
  tournamentsWon: number;
  totalScore: number;
  winRate: number;
  totalGames: number;
  isOnline: boolean;
}

interface LeaderboardUser extends UserStats {
  rank: number;
}

type SortType = 'winRate' | 'gamesWon' | 'tournamentsWon' | 'totalScore';
type FilterType = 'all' | 'active' | 'top10';

const Leaderboard: React.FC = () => {
  const { user } = useUser();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('winRate');
  const [filterBy, setFilterBy] = useState<FilterType>('all');

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userAPI.getAllUsers();
      const allUsers = response.data;
      
      // Enrichir avec les statistiques pour chaque utilisateur
      const usersWithStats = await Promise.all(
        allUsers.map(async (userData: any) => {
          try {
            const statsResponse = await userAPI.getUserStats(userData.id);
            const stats = statsResponse.data;
            
            return {
              id: userData.id,
              username: userData.username,
              displayName: userData.displayName,
              avatar: userData.avatar || '😀',
              gamesWon: stats.gamesWon || 0,
              gamesLost: stats.gamesLost || 0,
              tournamentsWon: stats.tournamentsWon || 0,
              totalScore: stats.totalScore || 0,
              isOnline: userData.isOnline || false,
              winRate: stats.winRate || 0,
              totalGames: (stats.gamesWon || 0) + (stats.gamesLost || 0)
            };
          } catch {
            return {
              id: userData.id,
              username: userData.username,
              displayName: userData.displayName,
              avatar: userData.avatar || '😀',
              gamesWon: 0,
              gamesLost: 0,
              tournamentsWon: 0,
              totalScore: 0,
              isOnline: userData.isOnline || false,
              winRate: 0,
              totalGames: 0
            };
          }
        })
      );

      setUsers(usersWithStats);
    } catch (err: any) {
      setError('Erreur lors du chargement du leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedAndFilteredUsers = (): LeaderboardUser[] => {
    let filteredUsers = [...users];

    // Appliquer les filtres
    switch (filterBy) {
      case 'active':
        filteredUsers = filteredUsers.filter(u => u.isOnline);
        break;
      case 'top10':
        filteredUsers = filteredUsers.slice(0, 10);
        break;
    }

    // Trier les utilisateurs
    filteredUsers.sort((a, b) => {
      switch (sortBy) {
        case 'winRate':
          if (a.totalGames === 0 && b.totalGames === 0) return 0;
          if (a.totalGames === 0) return 1;
          if (b.totalGames === 0) return -1;
          return b.winRate - a.winRate;
        case 'gamesWon':
          return b.gamesWon - a.gamesWon;
        case 'tournamentsWon':
          return b.tournamentsWon - a.tournamentsWon;
        case 'totalScore':
          return b.totalScore - a.totalScore;
        default:
          return 0;
      }
    });

    // Ajouter les rangs
    return filteredUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  };

  const rankedUsers = getSortedAndFilteredUsers();
  const currentUserRank = rankedUsers.find(u => u.id === user?.id)?.rank;

  const getPodiumIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getSortLabel = (sort: SortType) => {
    switch (sort) {
      case 'winRate': return 'Taux de victoire';
      case 'gamesWon': return 'Victoires';
      case 'tournamentsWon': return 'Tournois gagnés';
      case 'totalScore': return 'Score total';
    }
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">🏆 Leaderboard</h1>
            <p className="page-subtitle">Classement des joueurs</p>
          </div>
        </div>
        <div className="container">
          <div className="leaderboard-loading">
            <div className="loading-icon">⏳</div>
            <p>Chargement du classement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">🏆 Leaderboard</h1>
            <p className="page-subtitle">Classement des joueurs</p>
          </div>
        </div>
        <div className="container">
          <div className="leaderboard-error">
            <div className="error-icon">❌</div>
            <p>{error}</p>
            <button onClick={fetchLeaderboardData} className="btn btn-primary">
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <div className="container">
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-subtitle">
            Classement des {rankedUsers.length} joueurs
            {currentUserRank && ` • Votre position: ${getPodiumIcon(currentUserRank)}`}
          </p>
        </div>
      </div>

      <div className="container">
        <div className="leaderboard-controls">
          <div className="card">
            <div className="controls-section">
              <div className="control-group">
                <label className="control-label">Trier par:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="select"
                >
                  <option value="winRate">🎯 Taux de victoire</option>
                  <option value="gamesWon">🏆 Victoires</option>
                  <option value="tournamentsWon">🏅 Tournois gagnés</option>
                  <option value="totalScore">📊 Score total</option>
                </select>
              </div>

              <div className="control-group">
                <label className="control-label">Filtrer:</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterType)}
                  className="select"
                >
                  <option value="all">👥 Tous les joueurs</option>
                  <option value="active">🟢 Joueurs en ligne</option>
                  <option value="top10">⭐ Top 10</option>
                </select>
              </div>

              <button
                onClick={fetchLeaderboardData}
                className="btn btn-secondary"
                disabled={loading}
              >
                🔄 Actualiser
              </button>
            </div>
          </div>
        </div>

        {rankedUsers.length === 0 ? (
          <div className="card">
            <div className="leaderboard-empty">
              <div className="empty-icon">🏆</div>
              <h3>Aucun joueur trouvé</h3>
              <p>Aucun joueur ne correspond aux critères sélectionnés.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Podium pour le top 3 */}
            {rankedUsers.length >= 3 && filterBy !== 'active' && (
              <div className="leaderboard-podium">
                <div className="card">
                  <h3 className="podium-title">🏆 Podium</h3>
                  <div className="podium-grid">
                    {rankedUsers.slice(0, 3).map((rankedUser, index) => (
                      <div key={rankedUser.id} className={`podium-position position-${index + 1}`}>
                        <div className="podium-rank">{getPodiumIcon(index + 1)}</div>
                        <div className="podium-avatar">{rankedUser.avatar}</div>
                        <div className="podium-info">
                          <div className="podium-name">
                            {rankedUser.displayName || rankedUser.username}
                            {rankedUser.isOnline && <span className="online-indicator">🟢</span>}
                          </div>
                          <div className="podium-stat">
                            {sortBy === 'winRate' && `${rankedUser.winRate.toFixed(1)}%`}
                            {sortBy === 'gamesWon' && `${rankedUser.gamesWon} victoires`}
                            {sortBy === 'tournamentsWon' && `${rankedUser.tournamentsWon} tournois`}
                            {sortBy === 'totalScore' && `${rankedUser.totalScore} pts`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Liste complète */}
            <div className="leaderboard-list">
              <div className="card">
                <div className="leaderboard-header">
                  <h3>📋 Classement complet - {getSortLabel(sortBy)}</h3>
                </div>
                
                <div className="leaderboard-table">
                  <div className="table-header">
                    <div className="col-rank">Rang</div>
                    <div className="col-player">Joueur</div>
                    <div className="col-stats">Statistiques</div>
                    <div className="col-performance">Performance</div>
                  </div>

                  {rankedUsers.map((rankedUser) => (
                    <div
                      key={rankedUser.id}
                      className={`table-row ${rankedUser.id === user?.id ? 'current-user' : ''}`}
                    >
                      <div className="col-rank">
                        <span className="rank-badge">
                          {getPodiumIcon(rankedUser.rank)}
                        </span>
                      </div>

                      <div className="col-player">
                        <div className="player-info">
                          <div className="player-avatar">{rankedUser.avatar}</div>
                          <div className="player-details">
                            <div className="player-name">
                              {rankedUser.displayName || rankedUser.username}
                              {rankedUser.id === user?.id && (
                                <span className="you-indicator">(Vous)</span>
                              )}
                            </div>
                            <div className="player-status">
                              {rankedUser.isOnline ? (
                                <span className="status online">🟢 En ligne</span>
                              ) : (
                                <span className="status offline">⚫ Hors ligne</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-stats">
                        <div className="stats-grid">
                          <div className="stat-item">
                            <span className="stat-label">Victoires</span>
                            <span className="stat-value">{rankedUser.gamesWon}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Défaites</span>
                            <span className="stat-value">{rankedUser.gamesLost}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Tournois</span>
                            <span className="stat-value">{rankedUser.tournamentsWon}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-performance">
                        <div className="performance-main">
                          {sortBy === 'winRate' && (
                            <span className="perf-value">
                              {rankedUser.totalGames > 0 
                                ? `${rankedUser.winRate.toFixed(1)}%`
                                : 'N/A'
                              }
                            </span>
                          )}
                          {sortBy === 'gamesWon' && (
                            <span className="perf-value">{rankedUser.gamesWon}</span>
                          )}
                          {sortBy === 'tournamentsWon' && (
                            <span className="perf-value">{rankedUser.tournamentsWon}</span>
                          )}
                          {sortBy === 'totalScore' && (
                            <span className="perf-value">{rankedUser.totalScore}</span>
                          )}
                        </div>
                        <div className="performance-sub">
                          {rankedUser.totalGames} match{rankedUser.totalGames !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;