// frontend_B/src/components/TournamentBrackets/TournamentBrackets.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import './TournamentBrackets.css';

interface Match {
  id: number;
  player1: string;
  player2: string;
  player1Id?: number;
  player2Id?: number;
  player1Score: number;
  player2Score: number;
  status: string;
  bracketPosition: number;
  gameId?: string;
}

interface BracketData {
  tournamentId: number;
  tournamentName: string;
  status: string;
  type: string;
  totalRounds: number;
  brackets: Record<number, Match[]>;
}

interface TournamentBracketsProps {
  tournamentId: number;
  isCreator?: boolean;
  onMatchUpdate?: () => void;
}

const TournamentBrackets: React.FC<TournamentBracketsProps> = ({
  tournamentId,
  isCreator = false,
  onMatchUpdate
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    const fetchBrackets = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Fetching brackets for tournament:', tournamentId);
        const response = await tournamentAPI.getBrackets(tournamentId);
        console.log('🏆 Brackets API response:', response.data);
        console.log('🏆 Brackets object:', response.data.brackets);
        console.log('🏆 Brackets keys:', Object.keys(response.data.brackets || {}));
        setBracketData(response.data);
      } catch (err: any) {
        console.error('❌ Error loading brackets:', err);
        console.error('Error details:', err.response?.data);
        console.error('Error status:', err.response?.status);
        setError(err.response?.data?.message || 'Erreur lors du chargement des brackets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrackets();
  }, [tournamentId]);

  const isAwaitingPlayers = (match: Match) => {
    return !match.player1 || !match.player2 || match.player1 === 'TBD' || match.player2 === 'TBD';
  };

  const getMatchStatusIcon = (match: Match) => {
    if (isAwaitingPlayers(match)) {
      return '🔲';
    }
    
    switch (match.status) {
      case 'pending':
        return '⏳';
      case 'active':
        return '🎮';
      case 'finished':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'awaiting_players':
        return '🔲';
      default:
        return '❓';
    }
  };

  const getWinner = (match: Match) => {
    if (match.status !== 'finished') return null;
    return match.player1Score > match.player2Score ? match.player1 : match.player2;
  };

  const getRoundName = (round: number, totalRounds: number) => {
    if (round === totalRounds) return 'Finale';
    if (round === totalRounds - 1) return 'Demi-finale';
    if (round === totalRounds - 2) return 'Quart de finale';
    return `Round ${round}`;
  };

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleScoreUpdate = async (matchId: number, winnerId: number, player1Score: number, player2Score: number) => {
    try {
      await tournamentAPI.advanceWinner(tournamentId, matchId, {
        winnerId,
        player1Score,
        player2Score
      });
      
      // Recharger les brackets
      const response = await tournamentAPI.getBrackets(tournamentId);
      setBracketData(response.data);
      
      setSelectedMatch(null);
      onMatchUpdate?.();
      
      console.log('✅ Match updated successfully');
    } catch (err: any) {
      console.error('❌ Error updating match:', err);
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour du match');
    }
  };

  const handleStartMatch = async (match: Match) => {
    try {
      console.log('🚀 Starting tournament match:', { tournamentId, matchId: match.id });
      
      const response = await tournamentAPI.startTournamentMatch(tournamentId, match.id);
      console.log('✅ Match started:', response.data);
      
      // Rediriger vers le jeu
      window.location.href = response.data.gameUrl;
      
    } catch (err: any) {
      console.error('❌ Error starting match:', err);
      alert(err.response?.data?.message || 'Erreur lors du démarrage du match');
    }
  };

  const canUserPlayMatch = (match: Match): boolean => {
    if (!user) return false;
    return match.player1Id === user.id || match.player2Id === user.id;
  };

  if (isLoading) {
    return (
      <div className="brackets-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement des brackets...</p>
      </div>
    );
  }

  if (error || !bracketData) {
    return (
      <div className="brackets-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error || 'Aucun bracket disponible'}</p>
        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Debug: tournamentId={tournamentId}, error={error}, hasData={!!bracketData}
        </p>
      </div>
    );
  }

  // Vérifier si les brackets sont vides
  if (bracketData && Object.keys(bracketData.brackets).length === 0) {
    return (
      <div className="brackets-empty">
        <div className="empty-icon">⚠️</div>
        <h3>Aucun match généré pour ce tournoi</h3>
        <p>Le tournoi est démarré mais les brackets n'ont pas été créés correctement.</p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Status: {bracketData.status}, Rounds: {bracketData.totalRounds}
        </p>
        {isCreator && (
          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn btn-primary"
              onClick={async () => {
                try {
                  console.log('🔄 Force regenerating brackets...');
                  
                  // Utiliser le nouvel endpoint de force regénération
                  await tournamentAPI.forceRegenerateBrackets(tournamentId);
                  
                  // Recharger les brackets
                  console.log('🔄 Reloading brackets...');
                  const response = await tournamentAPI.getBrackets(tournamentId);
                  setBracketData(response.data);
                  
                  console.log('✅ Brackets force regenerated successfully');
                  alert('Brackets régénérés avec succès !');
                } catch (err: any) {
                  console.error('❌ Error force regenerating brackets:', err);
                  console.error('Full error:', err.response);
                  alert(`Erreur: ${err.response?.data?.message || err.message}`);
                }
              }}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🚀 Regénérer les brackets
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tournament-brackets">
      <div className="brackets-header">
        <h2 className="brackets-title">
          🏆 Brackets - {bracketData.tournamentName}
        </h2>
        <div className="brackets-info">
          <span className="rounds-count">{bracketData.totalRounds} rounds</span>
          <span className="tournament-type">{bracketData.type}</span>
        </div>
      </div>

      <div className="brackets-container">
        {Object.entries(bracketData.brackets)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([roundNum, matches]) => (
            <div key={roundNum} className="bracket-round">
              <div className="round-header">
                <h3 className="round-title">
                  {getRoundName(parseInt(roundNum), bracketData.totalRounds)}
                </h3>
                <span className="round-matches-count">
                  {matches.length} match{matches.length > 1 ? 'es' : ''}
                </span>
              </div>

              <div className="round-matches">
                {matches
                  .sort((a, b) => (a.bracketPosition || 0) - (b.bracketPosition || 0))
                  .map((match) => {
                    const winner = getWinner(match);
                    return (
                      <div
                        key={match.id}
                        className={`match-card ${match.status} ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                        onClick={() => handleMatchSelect(match)}
                      >
                        <div className="match-header">
                          <span className="match-status">
                            {getMatchStatusIcon(match)}
                          </span>
                          <span className="match-id">#{match.id}</span>
                        </div>

                        <div className="match-players">
                          <div className={`player ${winner === match.player1 ? 'winner' : ''}`}>
                            <span className="player-name">{match.player1}</span>
                            <span className="player-score">{match.player1Score}</span>
                          </div>
                          
                          <div className="match-vs">VS</div>
                          
                          <div className={`player ${winner === match.player2 ? 'winner' : ''}`}>
                            <span className="player-name">{match.player2}</span>
                            <span className="player-score">{match.player2Score}</span>
                          </div>
                        </div>

                        {winner && (
                          <div className="match-winner">
                            🏆 {winner}
                          </div>
                        )}

                        {/* Actions selon le statut du match et le rôle de l'utilisateur */}
                        {(match.status === 'pending' || match.status === 'active') && !isAwaitingPlayers(match) && (
                          <div className="match-actions">
                            {/* Bouton Jouer pour les participants */}
                            {canUserPlayMatch(match) && (
                              <button 
                                className="btn btn-sm btn-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartMatch(match);
                                }}
                              >
                                {match.status === 'active' ? '🎮 Rejoindre' : '🎮 Jouer'}
                              </button>
                            )}
                            
                            {/* Bouton Gérer pour le créateur */}
                            {isCreator && (
                              <button className="btn btn-sm btn-primary">
                                ⚙️ Gérer
                              </button>
                            )}
                          </div>
                        )}

                        {match.status === 'active' && (
                          <div className="match-actions">
                            <span className="match-status-text">🎮 Match en cours...</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
      </div>

      {/* Modal de gestion de match pour les créateurs */}
      {selectedMatch && isCreator && selectedMatch.status === 'pending' && (
        <MatchManagementModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onUpdate={handleScoreUpdate}
        />
      )}
    </div>
  );
};

// Composant modal pour la gestion des matchs
interface MatchManagementModalProps {
  match: Match;
  onClose: () => void;
  onUpdate: (matchId: number, winnerId: number, player1Score: number, player2Score: number) => void;
}

const MatchManagementModal: React.FC<MatchManagementModalProps> = ({
  match,
  onClose,
  onUpdate
}) => {
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [winner, setWinner] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!winner) {
      alert('Veuillez sélectionner un gagnant');
      return;
    }

    if (player1Score < 0 || player2Score < 0) {
      alert('Les scores ne peuvent pas être négatifs');
      return;
    }

    // Déterminer l'ID du gagnant
    const winnerId = winner === match.player1 ? match.player1Id : match.player2Id;
    
    if (!winnerId) {
      alert('Erreur: ID du gagnant introuvable');
      return;
    }
    
    onUpdate(match.id, winnerId, player1Score, player2Score);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🎮 Gérer le match #{match.id}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="match-info">
            <div className="players">
              <span>{match.player1}</span>
              <span>VS</span>
              <span>{match.player2}</span>
            </div>
          </div>

          <div className="score-inputs">
            <div className="score-group">
              <label>{match.player1}</label>
              <input
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(parseInt(e.target.value) || 0)}
                className="score-input"
              />
            </div>

            <div className="score-group">
              <label>{match.player2}</label>
              <input
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(parseInt(e.target.value) || 0)}
                className="score-input"
              />
            </div>
          </div>

          <div className="winner-selection">
            <label>Gagnant :</label>
            <select
              value={winner}
              onChange={(e) => setWinner(e.target.value)}
              className="winner-select"
              required
            >
              <option value="">Sélectionner le gagnant</option>
              <option value={match.player1}>{match.player1}</option>
              <option value={match.player2}>{match.player2}</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              ✅ Valider le résultat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentBrackets;