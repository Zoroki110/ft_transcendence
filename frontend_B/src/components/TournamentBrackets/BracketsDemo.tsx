// frontend_B/src/components/TournamentBrackets/BracketsDemo.tsx

import React, { useState } from 'react';
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
}

interface BracketData {
  tournamentId: number;
  tournamentName: string;
  status: string;
  type: string;
  totalRounds: number;
  brackets: Record<number, Match[]>;
}

const BracketsDemo: React.FC = () => {
  // Données de test
  const mockBracketData: BracketData = {
    tournamentId: 1,
    tournamentName: "Demo Tournament",
    status: "in_progress",
    type: "single_elimination",
    totalRounds: 3,
    brackets: {
      1: [
        {
          id: 1,
          player1: "Alice",
          player2: "Bob",
          player1Id: 1,
          player2Id: 2,
          player1Score: 5,
          player2Score: 3,
          status: "finished",
          bracketPosition: 0
        },
        {
          id: 2,
          player1: "Charlie",
          player2: "David",
          player1Id: 3,
          player2Id: 4,
          player1Score: 2,
          player2Score: 5,
          status: "finished",
          bracketPosition: 1
        },
        {
          id: 3,
          player1: "Eve",
          player2: "Frank",
          player1Id: 5,
          player2Id: 6,
          player1Score: 0,
          player2Score: 0,
          status: "pending",
          bracketPosition: 2
        },
        {
          id: 4,
          player1: "Grace",
          player2: "Henry",
          player1Id: 7,
          player2Id: 8,
          player1Score: 0,
          player2Score: 0,
          status: "active",
          bracketPosition: 3
        }
      ],
      2: [
        {
          id: 5,
          player1: "Alice",
          player2: "David",
          player1Id: 1,
          player2Id: 4,
          player1Score: 0,
          player2Score: 0,
          status: "pending",
          bracketPosition: 0
        },
        {
          id: 6,
          player1: "TBD",
          player2: "TBD",
          player1Score: 0,
          player2Score: 0,
          status: "pending",
          bracketPosition: 1
        }
      ],
      3: [
        {
          id: 7,
          player1: "TBD",
          player2: "TBD",
          player1Score: 0,
          player2Score: 0,
          status: "pending",
          bracketPosition: 0
        }
      ]
    }
  };

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const getMatchStatusIcon = (match: Match) => {
    switch (match.status) {
      case 'pending':
        return '⏳';
      case 'active':
        return '🎮';
      case 'finished':
        return '✅';
      case 'cancelled':
        return '❌';
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

  return (
    <div className="tournament-brackets">
      <div className="brackets-header">
        <h2 className="brackets-title">
          🏆 Demo Brackets - {mockBracketData.tournamentName}
        </h2>
        <div className="brackets-info">
          <span className="rounds-count">{mockBracketData.totalRounds} rounds</span>
          <span className="tournament-type">{mockBracketData.type}</span>
        </div>
      </div>

      <div className="brackets-container">
        {Object.entries(mockBracketData.brackets)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([roundNum, matches]) => (
            <div key={roundNum} className="bracket-round">
              <div className="round-header">
                <h3 className="round-title">
                  {getRoundName(parseInt(roundNum), mockBracketData.totalRounds)}
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
                        onClick={() => setSelectedMatch(match)}
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

                        {match.status === 'pending' && (
                          <div className="match-actions">
                            <button className="btn btn-sm btn-primary">
                              ⚙️ Gérer
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
      </div>

      {selectedMatch && (
        <div className="selected-match-info" style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'var(--card-background)',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid var(--primary)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            Match sélectionné #{selectedMatch.id}
          </h4>
          <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
            {selectedMatch.player1} vs {selectedMatch.player2}
          </p>
          <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
            Status: {selectedMatch.status}
          </p>
          <button 
            onClick={() => setSelectedMatch(null)}
            style={{
              marginTop: '0.5rem',
              background: 'var(--danger)',
              color: 'white',
              border: 'none',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
};

export default BracketsDemo;