// frontend_B/src/pages/Game/Game.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI, tournamentAPI, api, userAPI } from '../../services/api';
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
  const { gameId, lobbyId } = useParams<{ gameId?: string; lobbyId?: string }>();
  const navigate = useNavigate();
  const { loadStats } = useUser();
  
  // Détecter le mode spectateur depuis les paramètres d'URL
  const searchParams = new URLSearchParams(window.location.search);
  const isSpectator = searchParams.get('spectator') === 'true';
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: string; finalScore: any; playerNames?: any; endedByForfeit?: boolean } | null>(null);
  const [playerNames, setPlayerNames] = useState<{ player1: string; player2: string }>({ player1: 'Joueur 1', player2: 'Joueur 2' });
  const [rematchRequest, setRematchRequest] = useState<{ fromPlayer: string; fromName: string } | null>(null);
  const [waitingForRematch, setWaitingForRematch] = useState(false);
  const [currentSocketId, setCurrentSocketId] = useState<string | null>(null);
  const [friendRequestSent, setFriendRequestSent] = useState<Set<string>>(new Set());

  // Détecter si c'est un match de tournoi
  const isTournamentMatch = (gameId || lobbyId)?.includes('game_tournament_') || false;

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
    const initializeGame = () => {
      if (!gameId) {
        setError('ID de partie manquant');
        setIsLoading(false);
        return;
      }

      // Initialiser la partie avec des données par défaut
      // Le WebSocket se chargera de mettre à jour les vraies données
      setGameData({
        id: gameId,
        players: [],
        score: { player1: 0, player2: 0 },
        status: 'waiting',
        spectatorCount: 0
      });

      console.log(`🎮 Game initialized for: ${gameId}`);
      setIsLoading(false);
    };

    initializeGame();
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
    const isSystemMessage = messageData.senderId === 'system' || messageData.username === 'Système';
    setMessages(prev => [...prev, {
      username: messageData.username,
      message: messageData.message,
      timestamp: new Date(messageData.timestamp),
      senderId: messageData.senderId,
      isOwnMessage: messageData.senderId === currentSocketId,
      isSystem: isSystemMessage
    }]);
  };

  const handleSocketId = (socketId: string) => {
    setCurrentSocketId(socketId);
  };

  const handleGameEnd = (winner: 'player1' | 'player2', finalScore: any, receivedPlayerNames: any, endedByForfeit?: boolean) => {
    setGameEnded(true);
    setGameResult({ winner, finalScore, playerNames: receivedPlayerNames, endedByForfeit });
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
  const handleNewGame = () => {
    console.log('🎮 GAME: Redirection vers matchmaking pour nouvelle partie');
    navigate('/matchmaking');
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

  const handleAddFriend = async (playerUsername: string) => {
    try {
      console.log(`🔍 Recherche du joueur: ${playerUsername}`);

      // Trouver l'ID du joueur par son username
      const response = await userAPI.searchUsers(playerUsername);
      console.log('📋 Résultats de recherche:', response.data);

      const players = response.data;
      const player = players.find((p: any) => p.username === playerUsername);

      if (!player) {
        console.error(`❌ Joueur "${playerUsername}" introuvable`);
        alert('Joueur introuvable');
        return;
      }

      console.log(`✅ Joueur trouvé: ID=${player.id}, username=${player.username}`);

      // Envoyer la demande d'ami
      await userAPI.sendFriendRequest(player.id);
      setFriendRequestSent(prev => new Set(prev).add(playerUsername));
      alert(`Demande d'ami envoyée à ${playerUsername} !`);
      console.log(`✓ Demande d'ami envoyée à ${playerUsername} (ID: ${player.id})`);
    } catch (err: any) {
      console.error('❌ Erreur lors de la demande d\'ami:', err);
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi de la demande d\'ami');
    }
  };

  // Handler pour les matches de tournoi
  const handleTournamentMatchEnd = async (data: {
    winner: string;
    finalScore: any;
    tournamentId: number;
    matchId: number;
    redirectUrl: string;
    message: string;
    player1Id: number;
    player2Id: number;
  }) => {
    console.log('🏆 GAME: Match de tournoi terminé:', data);
    console.log('🔍 DEBUG PLAYER IDS:', { player1Id: data.player1Id, player2Id: data.player2Id });
    
    try {
      // Déterminer le winnerId en fonction du winner ('player1' ou 'player2')
      const player1Score = data.finalScore.player1 || 0;
      const player2Score = data.finalScore.player2 || 0;
      
      // Déterminer le winnerId correct en fonction des scores
      let winnerId: number;
      if (player1Score > player2Score) {
        winnerId = data.player1Id;
        console.log('🏆 TOURNAMENT: Player1 gagne avec score supérieur');
      } else {
        winnerId = data.player2Id;
        console.log('🏆 TOURNAMENT: Player2 gagne avec score supérieur');
      }

      console.log('🏆 TOURNAMENT: Mise à jour du tournoi avec winner:', winnerId, 'scores:', player1Score, 'vs', player2Score);
      
      // Mettre à jour le tournoi avec le résultat
      await tournamentAPI.advanceWinner(data.tournamentId, data.matchId, {
        winnerId: winnerId,
        player1Score: player1Score,
        player2Score: player2Score
      });

      console.log('✅ TOURNAMENT: Brackets mis à jour avec succès');
      
      // Afficher le message de fin avec succès
      alert(`${data.message}\nGagnant: ${data.winner}\nScore: ${player1Score} - ${player2Score}\n\nLes brackets ont été mis à jour !`);
      
    } catch (error: any) {
      console.error('❌ TOURNAMENT: Erreur mise à jour brackets:', error);
      alert(`${data.message}\nGagnant: ${data.winner}\nScore: ${data.finalScore.player1} - ${data.finalScore.player2}\n\n⚠️ Erreur lors de la mise à jour des brackets: ${error.response?.data?.message || error.message}`);
    }
    
    // Rediriger vers le tournoi après un délai plus court
    setTimeout(() => {
      console.log('🔄 TOURNAMENT: Redirection automatique vers:', data.redirectUrl || `/tournaments/${data.tournamentId}`);
      navigate(data.redirectUrl || `/tournaments/${data.tournamentId}`);
    }, 2000);
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
      <div className="game-container">
        <div className="game-layout">
          
          <div className="game-main">
            <div className="game-header-compact">
              <button className="btn-icon btn-quit" onClick={handleQuitGame} title="Quitter la partie">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>

            {isSpectator && (
              <div className="spectator-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Spectateur</span>
              </div>
            )}
            <div id="game-canvas-container" className="game-canvas">
              {(lobbyId || gameId) ? (
                <PongGame
                  gameId={lobbyId || gameId || ''}
                  isSpectator={isSpectator}
                  onGameEnd={handleGameEnd}
                  onTournamentMatchEnd={handleTournamentMatchEnd}
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
              <div className="player-item">
                <span className="player-username">{playerNames.player1}</span>
                {playerNames.player1 !== 'Joueur 1' && playerNames.player1 !== 'En attente...' && (
                  <button
                    className="btn-add-friend"
                    onClick={() => handleAddFriend(playerNames.player1)}
                    disabled={friendRequestSent.has(playerNames.player1)}
                    title="Ajouter en ami"
                  >
                    {friendRequestSent.has(playerNames.player1) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <div className="player-item">
                <span className="player-username">{playerNames.player2}</span>
                {playerNames.player2 !== 'Joueur 2' && playerNames.player2 !== 'En attente...' && (
                  <button
                    className="btn-add-friend"
                    onClick={() => handleAddFriend(playerNames.player2)}
                    disabled={friendRequestSent.has(playerNames.player2)}
                    title="Ajouter en ami"
                  >
                    {friendRequestSent.has(playerNames.player2) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    )}
                  </button>
                )}
              </div>
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

        {/* Message pour les spectateurs de tournoi */}
        {gameEnded && gameResult && isSpectator && isTournamentMatch && (
          <div className="game-end-overlay">
            <div className="game-end-menu spectator-message">
              <div className="game-end-header">
                <h2 className="game-end-title">
                  Match de Tournoi Terminé
                </h2>
                <div className="game-end-winner">
                  Gagnant : <span className="winner-name">{gameResult.winner === 'player1' ? playerNames.player1 : playerNames.player2}</span>
                </div>
                <div className="game-end-score">
                  Score final : {gameResult.finalScore.player1} - {gameResult.finalScore.player2}
                </div>
              </div>
              <div className="game-end-actions">
                <button
                  className="btn btn-primary btn-large game-end-btn"
                  onClick={() => navigate('/tournaments')}
                >
                  Retour aux Tournois
                </button>
                <button
                  className="btn btn-secondary btn-large game-end-btn"
                  onClick={() => navigate('/')}
                >
                  Accueil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu de fin de partie (pas pour les spectateurs de tournoi) */}
        {gameEnded && gameResult && !isSpectator && (
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
                  Nouvelle partie
                </button>
                {/* Le rematch n'est pas disponible pour les matchs de tournoi ni pour les parties terminées par forfait */}
                {!isTournamentMatch && !gameResult?.endedByForfeit && (
                  <button
                    className="btn btn-secondary btn-large game-end-btn"
                    onClick={handleRematch}
                    disabled={waitingForRematch}
                  >
                    {waitingForRematch ? 'En attente...' : 'Rejouer'}
                  </button>
                )}
                {/* Message si la partie s'est terminée par forfait */}
                {gameResult?.endedByForfeit && (
                  <div className="forfeit-message">
                    <p>Partie terminée par abandon</p>
                    <p className="forfeit-note">Le rematch n'est pas disponible</p>
                  </div>
                )}
                <button
                  className="btn btn-danger btn-large game-end-btn"
                  onClick={handleQuitToHome}
                >
                  Quitter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demande de rematch reçue (seulement pour les parties normales et non terminées par forfait) */}
        {rematchRequest && !isTournamentMatch && !gameResult?.endedByForfeit && (
          <div className="game-end-overlay">
            <div className="game-end-menu rematch-request">
              <div className="game-end-header">
                <h2 className="game-end-title">
                  Demande de rematch
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
                  Accepter
                </button>
                <button
                  className="btn btn-danger btn-large game-end-btn"
                  onClick={handleDeclineRematch}
                >
                  Refuser
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