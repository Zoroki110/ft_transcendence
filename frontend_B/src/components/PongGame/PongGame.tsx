import React, { useRef, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '../../contexts/UserContext';
import './PongGame.css';

interface GameState {
  ball: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
  };
  paddles: {
    player1: { y: number };
    player2: { y: number };
  };
  score: {
    player1: number;
    player2: number;
  };
  players: {
    player1: { name: string; id?: string };
    player2: { name: string; id?: string };
  };
  gameStatus: 'waiting' | 'playing' | 'paused' | 'finished';
}

interface PongGameProps {
  gameId: string;
  isSpectator?: boolean;
  onGameEnd?: (winner: 'player1' | 'player2', finalScore: any, playerNames: any, endedByForfeit?: boolean) => void;
  onTournamentMatchEnd?: (data: {
    winner: string;
    finalScore: any;
    tournamentId: number;
    matchId: number;
    redirectUrl: string;
    message: string;
    player1Id: number;
    player2Id: number;
  }) => void;
  onPlayerNamesUpdate?: (playerNames: any) => void;
  onRematchRequest?: () => void;
  onRematchRequested?: (data: { fromPlayer: string; fromName: string }) => void;
  onRematchStarted?: () => void;
  onRematchDeclined?: () => void;
  onAcceptRematch?: () => void;
  onDeclineRematch?: () => void;
  waitingForRematch?: boolean;
  onChatMessage?: (messageData: { username: string; message: string; timestamp: string; senderId: string }) => void;
  onSocketId?: (socketId: string) => void;
}

const PongGame: React.FC<PongGameProps> = ({
  gameId,
  isSpectator = false,
  onGameEnd,
  onTournamentMatchEnd,
  onPlayerNamesUpdate,
  onRematchRequest,
  onRematchRequested,
  onRematchStarted,
  onRematchDeclined,
  onAcceptRematch,
  onDeclineRematch,
  waitingForRematch,
  onChatMessage,
  onSocketId
}) => {
  const { user } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const animationRef = useRef<number>();
  const gameStateRef = useRef<GameState>(); // Ref pour accéder au gameState actuel dans les callbacks

  const [gameState, setGameState] = useState<GameState>({
    ball: { x: 400, y: 200, velocityX: 18, velocityY: 12 },
    paddles: { player1: { y: 150 }, player2: { y: 150 } },
    score: { player1: 0, player2: 0 },
    players: { player1: { name: 'En attente...' }, player2: { name: 'En attente...' } },
    gameStatus: 'waiting'
  });

  const [playerRole, setPlayerRole] = useState<'player1' | 'player2' | 'spectator'>('spectator');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [players, setPlayers] = useState<any>({});
  const [spectatorCount, setSpectatorCount] = useState(0);

  // Constantes du jeu - Tailles augmentées pour meilleure visibilité et gameplay plus rapide
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const PADDLE_WIDTH = 16;
  const PADDLE_HEIGHT = 120;
  const BALL_SIZE = 16;

  // Gestion des touches
  const keysPressed = useRef<Set<string>>(new Set());

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (playerRole === 'spectator') return;

    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown'].includes(key)) {
      event.preventDefault();
      keysPressed.current.add(key);
    }
  }, [playerRole]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    keysPressed.current.delete(key);
  }, []);

  // Throttling pour éviter de spammer le serveur
  const lastMoveTime = useRef(0);
  const MOVE_THROTTLE = 16; // Limiter à 60 messages par seconde maximum pour plus de réactivité

  // Envoyer les mouvements au serveur (avec throttling)
  const sendPaddleMovement = useCallback(() => {
    if (!socketRef.current || playerRole === 'spectator') return;

    const now = Date.now();
    if (now - lastMoveTime.current < MOVE_THROTTLE) return; // Throttle

    const keys = keysPressed.current;
    let shouldSend = false;
    let direction = '';

    if (playerRole === 'player1' || playerRole === 'player2') {
      if (keys.has('arrowup')) {
        direction = 'up';
        shouldSend = true;
      } else if (keys.has('arrowdown')) {
        direction = 'down';
        shouldSend = true;
      }
    }

    if (shouldSend) {
      socketRef.current.emit('movePaddle', { direction });
      lastMoveTime.current = now;
    }
  }, [playerRole]);

  // Dessiner le jeu avec style moderne et épuré
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fond dégradé moderne et élégant
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Ligne centrale minimaliste et élégante
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dessiner les paddles avec style moderne et épuré
    const paddleGradient1 = ctx.createLinearGradient(0, 0, PADDLE_WIDTH, 0);
    paddleGradient1.addColorStop(0, '#3b82f6');
    paddleGradient1.addColorStop(1, '#60a5fa');

    // Paddle joueur 1 (gauche) - Coins arrondis
    ctx.fillStyle = paddleGradient1;
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 15;
    roundRect(ctx, 8, gameState.paddles.player1.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    const paddleGradient2 = ctx.createLinearGradient(CANVAS_WIDTH - PADDLE_WIDTH, 0, CANVAS_WIDTH, 0);
    paddleGradient2.addColorStop(0, '#ec4899');
    paddleGradient2.addColorStop(1, '#f472b6');

    // Paddle joueur 2 (droite) - Coins arrondis
    ctx.fillStyle = paddleGradient2;
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 15;
    roundRect(ctx, CANVAS_WIDTH - PADDLE_WIDTH - 8, gameState.paddles.player2.y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dessiner la balle avec effet de glow moderne
    const ballGradient = ctx.createRadialGradient(
      gameState.ball.x + BALL_SIZE/2,
      gameState.ball.y + BALL_SIZE/2,
      0,
      gameState.ball.x + BALL_SIZE/2,
      gameState.ball.y + BALL_SIZE/2,
      BALL_SIZE
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.4, '#22d3ee');
    ballGradient.addColorStop(1, '#06b6d4');

    ctx.fillStyle = ballGradient;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(gameState.ball.x + BALL_SIZE/2, gameState.ball.y + BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dessiner les scores avec typographie moderne
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;

    // Score joueur 1
    ctx.fillText(
      gameState.score.player1.toString(),
      CANVAS_WIDTH / 4,
      90
    );

    // Score joueur 2
    ctx.fillText(
      gameState.score.player2.toString(),
      (3 * CANVAS_WIDTH) / 4,
      90
    );

    // Afficher les noms des joueurs avec style épuré
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 5;

    // Nom joueur 1 (gauche)
    ctx.fillText(
      gameState.players?.player1?.name || 'PLAYER 1',
      CANVAS_WIDTH / 4,
      130
    );

    // Nom joueur 2 (droite)
    ctx.fillText(
      gameState.players?.player2?.name || 'PLAYER 2',
      (3 * CANVAS_WIDTH) / 4,
      130
    );

    ctx.shadowBlur = 0;

    // Afficher le statut du jeu avec style moderne
    if (gameState.gameStatus === 'waiting') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#60a5fa';
      ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 20;
      ctx.fillText('En attente des joueurs...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.shadowBlur = 0;
    } else if (gameState.gameStatus === 'paused') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 20;
      ctx.fillText('PAUSE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.shadowBlur = 0;
    } else if (gameState.gameStatus === 'finished') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const winner = gameState.score.player1 > gameState.score.player2 ? 'PLAYER 1' : 'PLAYER 2';
      ctx.fillStyle = '#10b981';
      ctx.font = '700 40px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#059669';
      ctx.shadowBlur = 25;
      ctx.fillText(`${winner} GAGNE!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.fillText('Partie terminée', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    // Montrer les contrôles pour les joueurs avec style épuré
    if (playerRole !== 'spectator' && gameState.gameStatus === 'playing') {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      if (playerRole === 'player1') {
        ctx.fillText('↑↓ Déplacer', 12, CANVAS_HEIGHT - 12);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText('↑↓ Déplacer', CANVAS_WIDTH - 12, CANVAS_HEIGHT - 12);
      }
    }

    // Fonction helper pour dessiner des rectangles arrondis
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  }, [gameState, playerRole]);

  // Animation loop (optimisé pour correspondre au serveur à 30 FPS)
  const lastRenderTime = useRef(0);
  const RENDER_INTERVAL = 1000 / 30; // 30 FPS pour correspondre au serveur

  const animate = useCallback(() => {
    const now = Date.now();

    // Envoyer les mouvements plus fréquemment pour la réactivité
    sendPaddleMovement();

    // Mais limiter le rendu à 30 FPS pour correspondre au serveur
    if (now - lastRenderTime.current >= RENDER_INTERVAL) {
      drawGame();
      lastRenderTime.current = now;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [drawGame, sendPaddleMovement]);

  useEffect(() => {
    console.log(`🔵 WEBSOCKET: Initialisation connexion pour gameId=${gameId}, user=${user?.username}, isSpectator=${isSpectator}`);

    // Initialiser la connexion WebSocket
    socketRef.current = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/game`, {
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log(`🔵 WEBSOCKET: Connecté au serveur WebSocket, socket.id=${socket.id}`);
      setConnectionStatus('connected');
      // Envoyer l'ID du socket au parent
      onSocketId?.(socket.id);
      // Utiliser le nom de l'utilisateur connecté ou un nom par défaut
      const playerName = isSpectator ? undefined : (user?.displayName || user?.username || `Joueur ${Math.floor(Math.random() * 1000)}`);
      console.log(`🔵 WEBSOCKET: Émission joinGame avec gameId=${gameId}, isSpectator=${isSpectator}, playerName=${playerName}`);
      console.log(`🔍 DEBUG: user object:`, user);
      // Rejoindre le jeu
      socket.emit('joinGame', { gameId, isSpectator, playerName, userId: user?.id });
    });

    socket.on('gameJoined', (data: { role: string; gameState: GameState }) => {
      console.log(`🔵 WEBSOCKET: gameJoined reçu, role=${data.role}, gameStatus=${data.gameState.gameStatus}`);
      setPlayerRole(data.role as any);
      setGameState(data.gameState);
      gameStateRef.current = data.gameState; // Mettre à jour la ref

      // Mettre à jour les noms des joueurs si disponibles
      if (data.gameState.players?.player1?.name || data.gameState.players?.player2?.name) {
        const playerNames = {
          player1: data.gameState.players?.player1?.name || 'Joueur 1',
          player2: data.gameState.players?.player2?.name || 'Joueur 2'
        };
        onPlayerNamesUpdate?.(playerNames);
      }
    });

    socket.on('gameStateUpdate', (newGameState: GameState) => {
      console.log(`🔵 WEBSOCKET: gameStateUpdate reçu, gameStatus=${newGameState.gameStatus}`);
      setGameState(newGameState);
      gameStateRef.current = newGameState; // Mettre à jour la ref

      // Mettre à jour les noms des joueurs si disponibles
      if (newGameState.players?.player1?.name || newGameState.players?.player2?.name) {
        const playerNames = {
          player1: newGameState.players?.player1?.name || 'Joueur 1',
          player2: newGameState.players?.player2?.name || 'Joueur 2'
        };
        onPlayerNamesUpdate?.(playerNames);
      }
    });

    socket.on('gameStarted', (gameState: GameState) => {
      console.log(`🔵 WEBSOCKET: gameStarted reçu, gameStatus=${gameState.gameStatus}`);
      setGameState(gameState);
      gameStateRef.current = gameState; // Mettre à jour la ref

      // Mettre à jour les noms des joueurs si disponibles
      if (gameState.players?.player1?.name || gameState.players?.player2?.name) {
        const playerNames = {
          player1: gameState.players?.player1?.name || 'Joueur 1',
          player2: gameState.players?.player2?.name || 'Joueur 2'
        };
        onPlayerNamesUpdate?.(playerNames);
      }
    });

    socket.on('gameResumed', (gameState: GameState) => {
      console.log(`🔄 WEBSOCKET: gameResumed reçu, gameStatus=${gameState.gameStatus}`);
      setGameState(gameState);
      gameStateRef.current = gameState;
    });

    socket.on('gameEnded', (data: { winner: string; finalScore: any; endedByForfeit?: boolean }) => {
      console.log(`🔵 WEBSOCKET: gameEnded reçu, winner=${data.winner}, endedByForfeit=${data.endedByForfeit}`);
      // Utiliser gameStateRef.current pour obtenir les noms actuels des joueurs
      const currentGameState = gameStateRef.current;
      console.log(`🔍 DEBUG gameEnded: currentGameState =`, currentGameState);
      const playerNames = {
        player1: currentGameState?.players?.player1?.name || 'Joueur 1',
        player2: currentGameState?.players?.player2?.name || 'Joueur 2'
      };
      console.log(`🔍 DEBUG gameEnded: playerNames =`, playerNames);
      onGameEnd?.(data.winner as any, data.finalScore, playerNames, data.endedByForfeit);
    });

    // Événement spécifique pour les matches de tournoi
    socket.on('tournamentMatchEnded', (data: { 
      winner: string; 
      finalScore: any; 
      tournamentId: number; 
      matchId: number; 
      redirectUrl: string; 
      message: string;
    }) => {
      console.log(`🏆 WEBSOCKET: tournamentMatchEnded reçu, winner=${data.winner}, tournamentId=${data.tournamentId}`);
      console.log(`🏆 Message: ${data.message}`);
      onTournamentMatchEnd?.(data);
    });

    socket.on('playersUpdate', (data: { players: any; spectatorCount: number }) => {
      console.log(`🔵 WEBSOCKET: playersUpdate reçu, players=`, data.players, `spectatorCount=${data.spectatorCount}`);
      setPlayers(data.players);
      setSpectatorCount(data.spectatorCount);
    });

    socket.on('rematchRequested', (data: { fromPlayer: string; fromName: string }) => {
      console.log(`🔔 WEBSOCKET: rematchRequested reçu, fromPlayer=${data.fromPlayer}, fromName=${data.fromName}`);
      onRematchRequested?.(data);
    });

    socket.on('rematchStarted', (gameState: GameState) => {
      console.log(`🔄 WEBSOCKET: rematchStarted reçu`);
      setGameState(gameState);
      gameStateRef.current = gameState;
      onRematchStarted?.();
    });

    socket.on('rematchDeclined', () => {
      console.log(`❌ WEBSOCKET: rematchDeclined reçu`);
      onRematchDeclined?.();
    });

    socket.on('chatMessage', (messageData: { username: string; message: string; timestamp: string; senderId: string }) => {
      console.log(`💬 WEBSOCKET: chatMessage reçu, username=${messageData.username}, message=${messageData.message}`);
      onChatMessage?.(messageData);
    });

    // Déconnexion d'un joueur
    socket.on('playerDisconnected', (data: { disconnectedPlayer: string; playerName: string; message: string }) => {
      console.log(`⚠️ WEBSOCKET: Player disconnected - ${data.playerName}`);
      // Afficher une notification visuelle
      if (onChatMessage) {
        onChatMessage({
          username: 'Système',
          message: data.message,
          timestamp: new Date().toISOString(),
          senderId: 'system'
        });
      }
    });

    // Reconnexion d'un joueur
    socket.on('playerReconnected', (data: { player: string; playerName: string; message: string }) => {
      console.log(`✅ WEBSOCKET: Player reconnected - ${data.playerName}`);
      // Afficher une notification visuelle
      if (onChatMessage) {
        onChatMessage({
          username: 'Système',
          message: data.message,
          timestamp: new Date().toISOString(),
          senderId: 'system'
        });
      }
    });

    // Abandon d'un joueur
    socket.on('playerAbandoned', (data: { abandonedPlayer: string; playerName: string; winner: string; message: string }) => {
      console.log(`🏳️ WEBSOCKET: Player abandoned - ${data.playerName}, winner: ${data.winner}`);
      // Afficher une notification visuelle importante
      if (onChatMessage) {
        onChatMessage({
          username: 'Système',
          message: `🏳️ ${data.message}`,
          timestamp: new Date().toISOString(),
          senderId: 'system'
        });
      }
    });

    socket.on('connect_error', () => {
      console.log(`🔴 WEBSOCKET: Erreur de connexion WebSocket`);
      setConnectionStatus('error');
    });

    return () => {
      console.log(`🔵 WEBSOCKET: Déconnexion WebSocket pour gameId=${gameId}`);
      socket.disconnect();
    };
  }, [gameId, isSpectator, user?.username]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // useEffect séparé pour l'animation
  useEffect(() => {
    if (connectionStatus === 'connected') {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [connectionStatus, animate]);

  // Exposer les fonctions de rematch globalement
  useEffect(() => {
    (window as any).sendRematchRequest = () => {
      if (socketRef.current) {
        console.log('🔄 WEBSOCKET: Envoi requestRematch');
        socketRef.current.emit('requestRematch');
      }
    };

    (window as any).sendAcceptRematch = () => {
      if (socketRef.current) {
        console.log('✅ WEBSOCKET: Envoi acceptRematch');
        socketRef.current.emit('acceptRematch');
      }
    };

    (window as any).sendDeclineRematch = () => {
      if (socketRef.current) {
        console.log('❌ WEBSOCKET: Envoi declineRematch');
        socketRef.current.emit('declineRematch');
      }
    };

    (window as any).sendChatMessage = (message: string) => {
      if (socketRef.current && user) {
        console.log('💬 WEBSOCKET: Envoi sendChatMessage, message=', message);
        socketRef.current.emit('sendChatMessage', {
          message: message,
          username: user.displayName || user.username || 'Joueur'
        });
      }
    };

    return () => {
      // Nettoyer lors du démontage
      delete (window as any).sendRematchRequest;
      delete (window as any).sendAcceptRematch;
      delete (window as any).sendDeclineRematch;
      delete (window as any).sendChatMessage;
    };
  }, []);

  if (connectionStatus === 'connecting') {
    return (
      <div className="pong-loading">
        <div className="loading-spinner"></div>
        <p>Connexion au jeu...</p>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="pong-error">
        <p>Erreur de connexion au serveur de jeu</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="pong-game">
      <div className="pong-info">
        <div className="player-info">
          <span className={`player-indicator ${playerRole === 'player1' ? 'active' : ''}`}>
            {gameState.players?.player1?.name || 'En attente...'} {players.player1 ? '🟢' : '🔴'}
          </span>
          <span className="game-status">
            {gameState.gameStatus === 'waiting' && 'En attente'}
            {gameState.gameStatus === 'playing' && 'En cours'}
            {gameState.gameStatus === 'paused' && 'En pause'}
            {gameState.gameStatus === 'finished' && 'Terminé'}
          </span>
          <span className={`player-indicator ${playerRole === 'player2' ? 'active' : ''}`}>
            {gameState.players?.player2?.name || 'En attente...'} {players.player2 ? '🟢' : '🔴'}
          </span>
        </div>
        <div className="spectator-info">
          👀 {spectatorCount} spectateur{spectatorCount > 1 ? 's' : ''}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="pong-canvas"
        tabIndex={0}
      />

      {playerRole !== 'spectator' && (
        <div className="game-controls">
          <p>Vous êtes le <strong>{playerRole === 'player1' ? 'Joueur 1 (gauche)' : 'Joueur 2 (droite)'}</strong></p>
          <p>Utilisez <kbd>↑</kbd>/<kbd>↓</kbd> pour bouger votre paddle</p>
        </div>
      )}
    </div>
  );
};

export default PongGame;