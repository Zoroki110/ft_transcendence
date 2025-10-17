// frontend_B/src/components/MatchHistory/MatchHistory.tsx
import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import './MatchHistory.css';

interface Match {
  id: number;
  player1: {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  player2: {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  player1Score: number;
  player2Score: number;
  status: string;
  createdAt: string;
  finishedAt?: string;
  tournament?: {
    id: number;
    name: string;
  };
  round?: number;
}

interface MatchHistoryProps {
  userId?: number; // Si non fourni, utilise l'utilisateur connecté
  isMyProfile: boolean;
  limit?: number;
}

const MatchHistory: React.FC<MatchHistoryProps> = ({ userId, isMyProfile, limit = 10 }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');

  useEffect(() => {
    loadMatches();
  }, [userId, isMyProfile, filter]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        limit,
        status: 'finished',
      };

      const response = isMyProfile || !userId
        ? await userAPI.getMyMatches(params)
        : await userAPI.getUserMatches(userId, params);

      let matchesData = response.data || [];

      // Filtrer les matchs selon le filtre sélectionné
      if (filter !== 'all' && (isMyProfile || userId)) {
        const currentUserId = userId;
        matchesData = matchesData.filter((match: Match) => {
          const isPlayer1 = match.player1.id === currentUserId;
          const won = isPlayer1
            ? match.player1Score > match.player2Score
            : match.player2Score > match.player1Score;

          return filter === 'won' ? won : !won;
        });
      }

      setMatches(matchesData);
    } catch (err: any) {
      console.error('Erreur lors du chargement de l\'historique:', err);
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const getMatchResult = (match: Match, currentUserId?: number): 'won' | 'lost' | 'unknown' => {
    if (!currentUserId) return 'unknown';

    const isPlayer1 = match.player1.id === currentUserId;
    const won = isPlayer1
      ? match.player1Score > match.player2Score
      : match.player2Score > match.player1Score;

    return won ? 'won' : 'lost';
  };

  if (isLoading && matches.length === 0) {
    return (
      <div className="match-history-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="match-history-error">
        <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p>{error}</p>
        <button onClick={loadMatches} className="btn btn-sm btn-secondary">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="match-history">
      <div className="match-history-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tous
        </button>
        <button
          className={`filter-btn ${filter === 'won' ? 'active' : ''}`}
          onClick={() => setFilter('won')}
        >
          Victoires
        </button>
        <button
          className={`filter-btn ${filter === 'lost' ? 'active' : ''}`}
          onClick={() => setFilter('lost')}
        >
          Défaites
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="match-history-empty">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>Aucun match trouvé</p>
          <p className="empty-subtitle">
            {filter === 'all'
              ? 'Jouez des parties pour voir votre historique !'
              : `Aucune ${filter === 'won' ? 'victoire' : 'défaite'} trouvée`
            }
          </p>
        </div>
      ) : (
        <div className="match-history-list">
          {matches.map((match) => {
            const result = getMatchResult(match, userId);
            const isPlayer1 = match.player1.id === userId;
            const opponent = isPlayer1 ? match.player2 : match.player1;
            const myScore = isPlayer1 ? match.player1Score : match.player2Score;
            const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;

            return (
              <div
                key={match.id}
                className={`match-item ${result !== 'unknown' ? `match-${result}` : ''}`}
              >
                <div className="match-result-indicator">
                  {result === 'won' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : result === 'lost' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : null}
                </div>

                <div className="match-content">
                  <div className="match-players">
                    <div className="match-opponent">
                      <span className="opponent-avatar">
                        {opponent.avatar || '👤'}
                      </span>
                      <span className="opponent-name">
                        {opponent.displayName || opponent.username}
                      </span>
                    </div>
                    {match.tournament && (
                      <div className="match-tournament-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        {match.tournament.name}
                        {match.round && ` - Round ${match.round}`}
                      </div>
                    )}
                  </div>

                  <div className="match-score">
                    <span className={`score ${result === 'won' ? 'winner' : ''}`}>
                      {myScore}
                    </span>
                    <span className="score-separator">-</span>
                    <span className={`score ${result === 'lost' ? 'winner' : ''}`}>
                      {opponentScore}
                    </span>
                  </div>

                  <div className="match-date">
                    {formatDate(match.finishedAt || match.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
