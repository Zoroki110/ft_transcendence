// frontend_B/src/components/TournamentSpectator/TournamentSpectator.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import './TournamentSpectator.css';

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
  round?: number;
  bracketPosition?: number;
  gameId?: string;
}

interface TournamentSpectatorProps {
  tournamentId: number;
}

const TournamentSpectator: React.FC<TournamentSpectatorProps> = ({ tournamentId }) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpectating, setIsSpectating] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);

  useEffect(() => {
    loadMatches();

    // Rafraîchir les matchs toutes les 5 secondes
    const interval = setInterval(loadMatches, 5000);

    return () => clearInterval(interval);
  }, [tournamentId]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await tournamentAPI.getMatches(tournamentId);
      console.log('📊 Matches loaded - Full response:', response);
      console.log('📊 Response.data type:', typeof response.data);
      console.log('📊 Response.data:', response.data);

      // Gérer différentes structures de réponse possibles
      let fetchedMatches: Match[] = [];

      if (Array.isArray(response.data)) {
        // Si c'est déjà un tableau
        fetchedMatches = response.data;
      } else if (response.data && Array.isArray(response.data.matches)) {
        // Si c'est un objet avec une propriété matches
        fetchedMatches = response.data.matches;
      } else if (response.data && typeof response.data === 'object') {
        // Si c'est un objet, essayer de le convertir en tableau
        fetchedMatches = Object.values(response.data);
      } else {
        fetchedMatches = [];
      }

      console.log('📋 Fetched matches (array):', fetchedMatches);

      // Stocker tous les matchs
      setAllMatches(fetchedMatches);

      // Filtrer uniquement les matchs actifs (en cours)
      const activeMatches = Array.isArray(fetchedMatches)
        ? fetchedMatches.filter((match: Match) => match.status === 'active')
        : [];

      console.log('🎮 Active matches:', activeMatches);
      setMatches(activeMatches);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des matchs:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de chargement des matchs';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinAsSpectator = async () => {
    try {
      await tournamentAPI.joinAsSpectator(tournamentId);
      setIsSpectating(true);
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription en tant que spectateur:', err);
      alert(err.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  const handleLeaveAsSpectator = async () => {
    try {
      await tournamentAPI.leaveAsSpectator(tournamentId);
      setIsSpectating(false);
    } catch (err: any) {
      console.error('Erreur lors du départ en tant que spectateur:', err);
    }
  };

  const handleWatchMatch = (match: Match) => {
    // Utiliser le gameId du match s'il existe, sinon construire un ID
    const gameId = match.gameId;

    console.log('🎮 Watching match:', {
      matchId: match.id,
      gameId: gameId,
      match: match,
      tournamentId
    });

    if (!gameId) {
      alert('Ce match n\'a pas encore de partie associée. Le match n\'a peut-être pas encore commencé.');
      return;
    }

    // Naviguer vers la partie avec le paramètre spectateur
    navigate(`/game/${gameId}?spectator=true`);
  };

  const getRoundName = (round?: number): string => {
    if (!round) return 'Round inconnu';

    const roundNames: { [key: number]: string } = {
      1: 'Finale',
      2: 'Demi-finale',
      3: 'Quart de finale',
      4: '8ème de finale',
      5: '16ème de finale',
    };

    return roundNames[round] || `Round ${round}`;
  };

  if (error) {
    return (
      <div className="spectator-error">
        <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="tournament-spectator">
      <div className="spectator-header">
        <div className="spectator-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3>Mode spectateur</h3>
        </div>

        {!isSpectating ? (
          <button onClick={handleJoinAsSpectator} className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Suivre le tournoi
          </button>
        ) : (
          <button onClick={handleLeaveAsSpectator} className="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Ne plus suivre
          </button>
        )}
      </div>

      {isLoading && matches.length === 0 ? (
        <div className="spectator-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des matchs...</p>
        </div>
      ) : matches.length === 0 && !showAllMatches ? (
        <div className="spectator-empty">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Aucun match en cours</p>
          <p className="empty-subtitle">Les matchs apparaîtront ici quand ils commenceront</p>
          {allMatches.length > 0 && (
            <button
              onClick={() => setShowAllMatches(true)}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Voir tous les matchs ({allMatches.length})
            </button>
          )}
        </div>
      ) : (
        <div className="spectator-matches">
          <div className="matches-count">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>
              {showAllMatches
                ? `${allMatches.length} match${allMatches.length > 1 ? 's' : ''} au total`
                : `${matches.length} match${matches.length > 1 ? 's' : ''} en cours`
              }
            </span>
            {!showAllMatches && allMatches.length > matches.length && (
              <button
                onClick={() => setShowAllMatches(true)}
                className="btn btn-outline btn-sm"
                style={{ marginLeft: 'auto' }}
              >
                Voir tous ({allMatches.length})
              </button>
            )}
            {showAllMatches && (
              <button
                onClick={() => setShowAllMatches(false)}
                className="btn btn-outline btn-sm"
                style={{ marginLeft: 'auto' }}
              >
                En cours uniquement
              </button>
            )}
          </div>

          <div className="matches-list">
            {(showAllMatches ? allMatches : matches).map((match) => (
              <div key={match.id} className="match-card">
                <div className="match-round-badge">
                  {getRoundName(match.round)}
                </div>

                <div className="match-players-display">
                  <div className="match-player">
                    <span className="player-avatar">
                      {match.player1.avatar || '👤'}
                    </span>
                    <div className="player-info">
                      <span className="player-name">
                        {match.player1.displayName || match.player1.username}
                      </span>
                      <span className="player-score">{match.player1Score}</span>
                    </div>
                  </div>

                  <div className="match-vs">VS</div>

                  <div className="match-player">
                    <div className="player-info player-info-right">
                      <span className="player-score">{match.player2Score}</span>
                      <span className="player-name">
                        {match.player2.displayName || match.player2.username}
                      </span>
                    </div>
                    <span className="player-avatar">
                      {match.player2.avatar || '👤'}
                    </span>
                  </div>
                </div>

                <div className="match-actions">
                  <button
                    onClick={() => handleWatchMatch(match)}
                    className={`btn btn-full ${match.status === 'active' && match.gameId ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={!match.gameId}
                    title={!match.gameId ? 'La partie n\'a pas encore commencé' : ''}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {!match.gameId ? 'Partie non démarrée' :
                     match.status === 'active' ? 'Regarder en direct' :
                     match.status === 'finished' ? 'Voir le résultat' :
                     'Rejoindre le match'}
                  </button>

                  {match.status === 'active' && (
                    <div className="match-status-live">
                      <span className="live-indicator"></span>
                      EN DIRECT
                    </div>
                  )}
                  {match.status === 'pending' && (
                    <div className="match-status-pending">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      EN ATTENTE
                    </div>
                  )}
                  {match.status === 'finished' && (
                    <div className="match-status-finished">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      TERMINÉ
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentSpectator;
