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
              avatar: userData.avatar,
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
              avatar: userData.avatar,
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
    if (rank <= 3) {
      return (
        <svg className={`medal-icon rank-${rank}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      );
    }
    return <span className="rank-number">#{rank}</span>;
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
            <div className="header-content">
              <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <div>
                <h1 className="page-title">Leaderboard</h1>
                <p className="page-subtitle">Classement des joueurs</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="leaderboard-loading">
            <div className="loading-spinner"></div>
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
            <div className="header-content">
              <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <div>
                <h1 className="page-title">Leaderboard</h1>
                <p className="page-subtitle">Classement des joueurs</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="leaderboard-error">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
            <button onClick={fetchLeaderboardData} className="btn btn-primary">
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réessayer
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
          <div className="header-content">
            <div className="header-left">
              <div className="header-icon-wrapper">
                <svg className="header-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                </svg>
              </div>
              <div className="header-text">
                <h1 className="page-title">Classement des Joueurs</h1>
                <p className="page-subtitle">
                  {rankedUsers.length} joueur{rankedUsers.length > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
            {currentUserRank && (
              <div className="user-rank-badge">
                <div className="rank-badge-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="rank-badge-content">
                  <span className="rank-badge-label">Votre position</span>
                  <span className="rank-badge-value">#{currentUserRank}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="leaderboard-controls">
          <div className="card">
            <div className="controls-section">
              <div className="control-group">
                <label className="control-label">
                  <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="select"
                >
                  <option value="winRate">Taux de victoire</option>
                  <option value="gamesWon">Victoires</option>
                  <option value="tournamentsWon">Tournois gagnés</option>
                  <option value="totalScore">Score total</option>
                </select>
              </div>

              <div className="control-group">
                <label className="control-label">
                  <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtrer
                </label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterType)}
                  className="select"
                >
                  <option value="all">Tous les joueurs</option>
                  <option value="active">Joueurs en ligne</option>
                  <option value="top10">Top 10</option>
                </select>
              </div>

              <button
                onClick={fetchLeaderboardData}
                className="btn btn-secondary"
                disabled={loading}
              >
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {rankedUsers.length === 0 ? (
          <div className="card">
            <div className="leaderboard-empty">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
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
                  <div className="podium-header">
                    <svg className="podium-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <h3 className="podium-title">Podium</h3>
                  </div>
                  <div className="podium-grid">
                    {rankedUsers.slice(0, 3).map((rankedUser, index) => (
                      <div key={rankedUser.id} className={`podium-position position-${index + 1}`}>
                        <div className="podium-rank-badge">
                          {index === 0 && (
                            <svg className="medal-svg gold" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                            </svg>
                          )}
                          {index === 1 && (
                            <svg className="medal-svg silver" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                            </svg>
                          )}
                          {index === 2 && (
                            <svg className="medal-svg bronze" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                            </svg>
                          )}
                        </div>
                        <div className="podium-avatar">
                          {rankedUser.avatar || (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          )}
                        </div>
                        <div className="podium-info">
                          <div className="podium-name">
                            {rankedUser.displayName || rankedUser.username}
                            {rankedUser.isOnline && (
                              <span className="online-indicator">
                                <span className="online-dot"></span>
                              </span>
                            )}
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
                  <svg className="list-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3>Classement complet - {getSortLabel(sortBy)}</h3>
                </div>
                
                <div className="leaderboard-table">
                  <div className="table-header">
                    <div className="col-rank">Rang</div>
                    <div className="col-player">Joueur</div>
                    <div className="col-stats">
                      <div className="stat-header-item">Victoires</div>
                      <div className="stat-header-item">Défaites</div>
                      <div className="stat-header-item">Tournois</div>
                    </div>
                    <div className="col-performance">
                      {sortBy === 'winRate' && 'Taux victoire'}
                      {sortBy === 'gamesWon' && 'Victoires'}
                      {sortBy === 'tournamentsWon' && 'Tournois'}
                      {sortBy === 'totalScore' && 'Score'}
                    </div>
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
                          <div className="player-avatar">
                            {rankedUser.avatar ? (
                              rankedUser.avatar
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            )}
                          </div>
                          <div className="player-details">
                            <div className="player-name">
                              {rankedUser.displayName || rankedUser.username}
                              {rankedUser.id === user?.id && (
                                <span className="you-indicator">(Vous)</span>
                              )}
                            </div>
                            <div className="player-status">
                              {rankedUser.isOnline ? (
                                <span className="status online">
                                  <span className="status-dot online"></span>
                                  En ligne
                                </span>
                              ) : (
                                <span className="status offline">
                                  <span className="status-dot offline"></span>
                                  Hors ligne
                                </span>
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