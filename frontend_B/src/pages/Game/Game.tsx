// frontend_B/src/pages/Game/Game.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { gameAPI } from '../../services/api';
import './Game.css';

interface GameData {
  id: string;
  players: Array<{
    id: string;
    username: string;
    avatar: string;
  }>;
  score: {
    player1: number;
    player2: number;
  };
  status: 'waiting' | 'playing' | 'finished';
  spectatorCount: number;
}

const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);
        const response = await gameAPI.getGame(gameId);
        setGameData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur de chargement');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [gameId]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    setMessages(prev => [...prev, {
      username: 'Moi',
      message: chatMessage,
      timestamp: new Date()
    }]);
    setChatMessage('');
  };

  if (isLoading) {
    return (
      <div className="game-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement de la partie...</p>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="game-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error || 'Partie introuvable'}</p>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <div className="container">
          <div className="game-header-content">
            <h1 className="game-title">🏓 Partie Pong</h1>
            
            <div className="game-score">
              <div className="player-score">
                <div className="player-name">{gameData.players[0]?.username || 'Joueur 1'}</div>
                <div className="score-value">{gameData.score.player1}</div>
              </div>
              <div className="score-vs">VS</div>
              <div className="player-score">
                <div className="player-name">{gameData.players[1]?.username || 'Joueur 2'}</div>
                <div className="score-value">{gameData.score.player2}</div>
              </div>
            </div>

            <div className="game-header-actions">
              <button className="btn btn-secondary">⚙️</button>
              <button className="btn btn-danger">🚪 Quitter</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="game-layout">
          
          <div className="card game-area">
            <div id="game-canvas-container" className="game-canvas">
              <div className="game-placeholder">
                <div className="game-placeholder-icon">🎮</div>
                <div className="game-placeholder-title">Zone du moteur de jeu (Game_D)</div>
                <div className="game-placeholder-subtitle">
                  Canvas WebGL sera injecté ici
                </div>
              </div>
            </div>
          </div>

          <div className="game-sidebar">
            <div className="card game-players">
              <h3 className="sidebar-title">👥 Joueurs</h3>
              {gameData.players.map((player) => (
                <div key={player.id} className="player-item">
                  <span className="player-avatar">{player.avatar || '😀'}</span>
                  <span className="player-username">{player.username}</span>
                </div>
              ))}
            </div>

            <div className="card game-spectators">
              <h3 className="sidebar-title">
                👀 Spectateurs ({gameData.spectatorCount})
              </h3>
            </div>

            <div className="card game-chat">
              <h3 className="sidebar-title">💬 Chat</h3>
              
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    Aucun message
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="chat-message">
                      <strong className="chat-username">{msg.username}:</strong>{' '}
                      <span className="chat-text">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  className="input"
                  placeholder="Message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  className="btn btn-primary chat-send"
                  onClick={handleSendMessage}
                >
                  📤
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;