// frontend_B/src/pages/Game/Game.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';
import PongGame from '../../components/PongGame/PongGame';
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
  const navigate = useNavigate();
  const { loadStats } = useUser();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: string; finalScore: any; playerNames?: any } | null>(null);
  const [playerNames, setPlayerNames] = useState<{ player1: string; player2: string }>({ player1: 'Joueur 1', player2: 'Joueur 2' });
  const [rematchRequest, setRematchRequest] = useState<{ fromPlayer: string; fromName: string } | null>(null);
  const [waitingForRematch, setWaitingForRematch] = useState(false);
  const [currentSocketId, setCurrentSocketId] = useState<string | null>(null);

  // Fonction pour générer une couleur basée sur le nom d'utilisateur
  const getUserColor = (username: string): string => {
    const colors = [
      '#FF6B6B', // Rouge
      '#4ECDC4', // Turquoise
      '#45B7D1', // Bleu
      '#96CEB4', // Vert
      '#FFEAA7', // Jaune
      '#DDA0DD', // Violet clair
      '#98D8C8', // Menthe
      '#F7DC6F', // Or
      '#BB8FCE', // Lavande
      '#85C1E9', // Bleu clair
      '#F8C471', // Orange
      '#82E0AA', // Vert clair
    ];

    // Générer un hash simple du nom d'utilisateur
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Utiliser le hash pour sélectionner une couleur
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameId) return;

      try {
        setIsLoading(true);
        // Pour les parties rapides, pas besoin d'appeler l'API
        // Les données sont gérées par WebSocket
        if (gameId.startsWith('game_') || gameId.startsWith('quick_')) {
          setGameData({
            id: gameId,
            players: [],
            score: { player1: 0, player2: 0 },
            status: 'waiting',
            spectatorCount: 0
          });
        } else if (gameId.startsWith('tournament_')) {
          // Pour les matchs de tournoi
          const matchId = gameId.replace('tournament_', '');
          console.log('🎮 Loading tournament match:', { gameId, matchId });
          
          const response = await gameAPI.getMatch(parseInt(matchId));
          const match = response.data;
          
          console.log('🎮 Tournament match data:', match);
          
          // Vérifier que match a les bonnes propriétés
          if (!match || !match.player1 || !match.player2) {
            throw new Error('Données de match incomplètes');
          }
          
          // Adapter le format du match au format attendu par la page Game
          setGameData({
            id: gameId,
            players: [
              {
                id: match.player1.id.toString(),
                username: match.player1.username,
                avatar: match.player1.avatar || '👤'
              },
              {
                id: match.player2.id.toString(),
                username: match.player2.username,
                avatar: match.player2.avatar || '👤'
              }
            ],
            score: { 
              player1: match.player1Score || 0, 
              player2: match.player2Score || 0 
            },
            status: match.status === 'active' ? 'playing' : (match.status === 'finished' ? 'finished' : 'waiting'),
            spectatorCount: 0
          });
          
          // Mettre à jour les noms des joueurs
          setPlayerNames({
            player1: match.player1.username,
            player2: match.player2.username
          });
          
          console.log('✅ Tournament match loaded successfully');
        } else {
          // Pour les matchs existants (ID numérique)
          const response = await gameAPI.getGame(gameId);
          setGameData(response.data);
        }
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

    // Envoyer via WebSocket
    if ((window as any).sendChatMessage) {
      (window as any).sendChatMessage(chatMessage);
    }
    setChatMessage('');
  };

  const handleChatMessage = (messageData: { username: string; message: string; timestamp: string; senderId: string }) => {
    console.log('💬 GAME: Message de chat reçu:', messageData);
    setMessages(prev => [...prev, {
      username: messageData.username,
      message: messageData.message,
      timestamp: new Date(messageData.timestamp),
      senderId: messageData.senderId,
      isOwnMessage: messageData.senderId === currentSocketId
    }]);
  };

  const handleSocketId = (socketId: string) => {
    setCurrentSocketId(socketId);
  };

  const handleGameEnd = (winner: 'player1' | 'player2', finalScore: any, receivedPlayerNames: any) => {
    setGameEnded(true);
    setGameResult({ winner, finalScore, playerNames: receivedPlayerNames });
    setPlayerNames(receivedPlayerNames);

    // Rafraîchir les statistiques du joueur après la partie
    console.log('🔄 GAME: Rafraîchissement des stats après fin de partie');
    loadStats().catch(err => {
      console.warn('⚠️ GAME: Erreur lors du rafraîchissement des stats:', err);
    });
  };

  const handleQuitGame = () => {
    if (confirm('Êtes-vous sûr de vouloir quitter la partie ?')) {
      navigate('/');
    }
  };

  // Fonctions pour le menu de fin de partie
  const handleNewGame = async () => {
    try {
      console.log('🎮 GAME: Création d\'une nouvelle partie');
      const response = await gameAPI.createQuickMatch();
      const newGameId = response.data.gameId;
      console.log('🎮 GAME: Nouvelle partie créée:', newGameId);
      navigate(`/game/${newGameId}`);
    } catch (error) {
      console.error('🔴 GAME: Erreur lors de la création d\'une nouvelle partie:', error);
      alert('Impossible de créer une nouvelle partie. Veuillez réessayer.');
    }
  };

  const handleRematch = () => {
    console.log('🔄 GAME: Demande de rematch envoyée');
    setWaitingForRematch(true);
    // Appel de la fonction depuis le composant PongGame
    if ((window as any).sendRematchRequest) {
      (window as any).sendRematchRequest();
    }
  };

  const handleAcceptRematch = () => {
    console.log('✅ GAME: Rematch accepté');
    setRematchRequest(null);
    // Appel de la fonction depuis le composant PongGame
    if ((window as any).sendAcceptRematch) {
      (window as any).sendAcceptRematch();
    }
  };

  const handleDeclineRematch = () => {
    console.log('❌ GAME: Rematch refusé');
    setRematchRequest(null);
    setWaitingForRematch(false);
    // Appel de la fonction depuis le composant PongGame
    if ((window as any).sendDeclineRematch) {
      (window as any).sendDeclineRematch();
    }
  };

  const handleRematchRequested = (data: { fromPlayer: string; fromName: string }) => {
    console.log('🔔 GAME: Demande de rematch reçue:', data);
    setRematchRequest(data);
  };

  const handleRematchStarted = () => {
    console.log('🔄 GAME: Rematch démarré');
    setGameEnded(false);
    setGameResult(null);
    setRematchRequest(null);
    setWaitingForRematch(false);
  };

  const handleRematchDeclined = () => {
    console.log('❌ GAME: Rematch refusé par l\'adversaire');
    setRematchRequest(null);
    setWaitingForRematch(false);
  };

  const handleQuitToHome = () => {
    navigate('/');
  };

  const handlePlayerNamesUpdate = (updatedPlayerNames: any) => {
    setPlayerNames(updatedPlayerNames);
  };

  if (isLoading) {
    return (
      <div className="game-loading">
        <div className="loading-icon">⏳</div>
        <p>Chargement de la partie...</p>
      </div>
    );
  }

  if (error || !gameData || !gameData.score || !playerNames) {
    return (
      <div className="game-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error || 'Partie introuvable'}</p>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>
          Debug: gameData={!!gameData}, score={!!gameData?.score}, playerNames={!!playerNames}
        </p>
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
                <div className="player-name">{playerNames.player1}</div>
                <div className="score-value">{gameData.score.player1}</div>
              </div>
              <div className="score-vs">VS</div>
              <div className="player-score">
                <div className="player-name">{playerNames.player2}</div>
                <div className="score-value">{gameData.score.player2}</div>
              </div>
            </div>

            <div className="game-header-actions">
              <button className="btn btn-secondary">⚙️</button>
              <button className="btn btn-danger" onClick={handleQuitGame}>🚪 Quitter</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="game-layout">
          
          <div className="card game-area">
            <div id="game-canvas-container" className="game-canvas">
              {gameId ? (
                <PongGame
                  gameId={gameId}
                  onGameEnd={handleGameEnd}
                  onPlayerNamesUpdate={handlePlayerNamesUpdate}
                  onRematchRequest={handleRematch}
                  onRematchRequested={handleRematchRequested}
                  onRematchStarted={handleRematchStarted}
                  onRematchDeclined={handleRematchDeclined}
                  onAcceptRematch={handleAcceptRematch}
                  onDeclineRematch={handleDeclineRematch}
                  waitingForRematch={waitingForRematch}
                  onChatMessage={handleChatMessage}
                  onSocketId={handleSocketId}
                />
              ) : (
                <div className="game-placeholder">
                  <div className="game-placeholder-icon">🎮</div>
                  <div className="game-placeholder-title">Aucun ID de partie fourni</div>
                  <div className="game-placeholder-subtitle">
                    Retournez à l'accueil pour créer une partie
                  </div>
                </div>
              )}
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
                  messages.map((msg, index) => {
                    const userColor = msg.isOwnMessage ? '#9932CC' : getUserColor(msg.username);
                    const messageStyle = msg.isOwnMessage
                      ? { borderLeftColor: userColor }
                      : { borderLeftColor: userColor, backgroundColor: `${userColor}15` };

                    return (
                      <div
                        key={index}
                        className={`chat-message ${msg.isSystem ? 'system-message' : ''} ${msg.isOwnMessage ? 'own-message' : 'other-message'}`}
                        style={messageStyle}
                      >
                        <strong
                          className="chat-username"
                          style={{ color: userColor }}
                        >
                          {msg.isOwnMessage ? 'Moi' : msg.username}:
                        </strong>{' '}
                        <span className="chat-text">{msg.message}</span>
                      </div>
                    );
                  })
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

        {/* Menu de fin de partie */}
        {gameEnded && gameResult && (
          <div className="game-end-overlay">
            <div className="game-end-menu">
              <div className="game-end-header">
                <h2 className="game-end-title">
                  {gameResult.winner === 'player1'
                    ? (gameResult.playerNames?.player1 || 'Joueur 1')
                    : (gameResult.playerNames?.player2 || 'Joueur 2')
                  } a gagné!
                </h2>
                <div className="game-end-score">
                  Score final: {gameResult.finalScore.player1} - {gameResult.finalScore.player2}
                </div>
              </div>

              <div className="game-end-actions">
                <button
                  className="btn btn-primary btn-large game-end-btn"
                  onClick={handleNewGame}
                >
                  🎮 Nouvelle partie
                </button>
                <button
                  className="btn btn-secondary btn-large game-end-btn"
                  onClick={handleRematch}
                  disabled={waitingForRematch}
                >
                  {waitingForRematch ? '⏳ En attente...' : '🔄 Rejouer'}
                </button>
                <button
                  className="btn btn-danger btn-large game-end-btn"
                  onClick={handleQuitToHome}
                >
                  🚪 Quitter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demande de rematch reçue */}
        {rematchRequest && (
          <div className="game-end-overlay">
            <div className="game-end-menu rematch-request">
              <div className="game-end-header">
                <h2 className="game-end-title">
                  🔔 Demande de rematch
                </h2>
                <div className="rematch-message">
                  <strong>{rematchRequest.fromName}</strong> souhaite faire un rematch.
                  <br />
                  Acceptez-vous de rejouer ?
                </div>
              </div>

              <div className="game-end-actions">
                <button
                  className="btn btn-primary btn-large game-end-btn"
                  onClick={handleAcceptRematch}
                >
                  ✅ Accepter
                </button>
                <button
                  className="btn btn-danger btn-large game-end-btn"
                  onClick={handleDeclineRematch}
                >
                  ❌ Refuser
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Game;