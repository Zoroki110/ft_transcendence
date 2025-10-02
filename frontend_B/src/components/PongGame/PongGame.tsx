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
  onGameEnd?: (winner: 'player1' | 'player2', finalScore: any, playerNames: any) => void;
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

  // Constantes du jeu
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 400;
  const PADDLE_WIDTH = 10;
  const PADDLE_HEIGHT = 100;
  const BALL_SIZE = 10;

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

  // Dessiner le jeu avec style rétro
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Effacer le canvas avec un noir pur rétro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dessiner un effet de scanlines rétro
    ctx.fillStyle = 'rgba(138, 43, 226, 0.03)';
    for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
      ctx.fillRect(0, i, CANVAS_WIDTH, 2);
    }

    // Dessiner la ligne centrale avec style rétro violet
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#8A2BE2';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#8A2BE2';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Dessiner les paddles avec effet néon violet
    ctx.fillStyle = '#9932CC';
    ctx.shadowColor = '#9932CC';
    ctx.shadowBlur = 15;

    // Paddle joueur 1 (gauche) avec effet rétro
    ctx.fillRect(0, gameState.paddles.player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    // Bordure lumineuse
    ctx.strokeStyle = '#DA70D6';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, gameState.paddles.player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Paddle joueur 2 (droite) avec effet rétro
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.paddles.player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    // Bordure lumineuse
    ctx.strokeRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.paddles.player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Dessiner la balle ronde avec effet néon violet éclatant
    ctx.fillStyle = '#FF00FF';
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(gameState.ball.x + BALL_SIZE/2, gameState.ball.y + BALL_SIZE/2, BALL_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    // Bordure lumineuse pour la balle ronde
    ctx.strokeStyle = '#FF00FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Dessiner les scores avec police rétro violet
    ctx.fillStyle = '#9932CC';
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#9932CC';
    ctx.shadowBlur = 15;

    // Score joueur 1
    ctx.fillText(
      gameState.score.player1.toString(),
      CANVAS_WIDTH / 4,
      80
    );

    // Score joueur 2
    ctx.fillText(
      gameState.score.player2.toString(),
      (3 * CANVAS_WIDTH) / 4,
      80
    );

    // Afficher les noms des joueurs avec style rétro violet
    ctx.fillStyle = '#DA70D6';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#DA70D6';
    ctx.shadowBlur = 10;

    // Nom joueur 1 (gauche)
    ctx.fillText(
      gameState.players?.player1?.name || 'PLAYER_1',
      CANVAS_WIDTH / 4,
      120
    );

    // Nom joueur 2 (droite)
    ctx.fillText(
      gameState.players?.player2?.name || 'PLAYER_2',
      (3 * CANVAS_WIDTH) / 4,
      120
    );

    // Reset shadow
    ctx.shadowBlur = 0;

    // Afficher le statut du jeu avec style rétro violet
    if (gameState.gameStatus === 'waiting') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#9932CC';
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#9932CC';
      ctx.shadowBlur = 15;
      ctx.fillText('>>> WAITING FOR PLAYERS <<<', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.shadowBlur = 0;
    } else if (gameState.gameStatus === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#DA70D6';
      ctx.font = 'bold 32px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#DA70D6';
      ctx.shadowBlur = 15;
      ctx.fillText('*** PAUSED ***', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.shadowBlur = 0;
    } else if (gameState.gameStatus === 'finished') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const winner = gameState.score.player1 > gameState.score.player2 ? 'PLAYER_1' : 'PLAYER_2';
      ctx.fillStyle = '#FF00FF';
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FF00FF';
      ctx.shadowBlur = 20;
      ctx.fillText(`${winner} WINS!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillStyle = '#DA70D6';
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.shadowColor = '#DA70D6';
      ctx.shadowBlur = 10;
      ctx.fillText('>>> GAME OVER <<<', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.shadowBlur = 0;
    }

    // Montrer les contrôles pour les joueurs avec style rétro violet
    if (playerRole !== 'spectator' && gameState.gameStatus === 'playing') {
      ctx.fillStyle = '#DA70D6';
      ctx.font = '14px "Courier New", monospace';
      ctx.shadowColor = '#DA70D6';
      ctx.shadowBlur = 5;
      ctx.textAlign = 'left';
      if (playerRole === 'player1') {
        ctx.fillText('[↑/↓] TO MOVE', 10, CANVAS_HEIGHT - 10);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText('[↑/↓] TO MOVE', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
      }
      ctx.shadowBlur = 0;
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

    socket.on('gameEnded', (data: { winner: string; finalScore: any }) => {
      console.log(`🔵 WEBSOCKET: gameEnded reçu, winner=${data.winner}`);
      // Utiliser gameStateRef.current pour obtenir les noms actuels des joueurs
      const currentGameState = gameStateRef.current;
      console.log(`🔍 DEBUG gameEnded: currentGameState =`, currentGameState);
      const playerNames = {
        player1: currentGameState?.players?.player1?.name || 'Joueur 1',
        player2: currentGameState?.players?.player2?.name || 'Joueur 2'
      };
      console.log(`🔍 DEBUG gameEnded: playerNames =`, playerNames);
      onGameEnd?.(data.winner as any, data.finalScore, playerNames);
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