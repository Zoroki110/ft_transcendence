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
  onGameEnd?: (winner: 'player1' | 'player2', finalScore: any) => void;
}

const PongGame: React.FC<PongGameProps> = ({ gameId, isSpectator = false, onGameEnd }) => {
  const { user } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const animationRef = useRef<number>();

  const [gameState, setGameState] = useState<GameState>({
    ball: { x: 400, y: 200, velocityX: 5, velocityY: 3 },
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
    if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
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
  const MOVE_THROTTLE = 50; // Limiter à 20 messages par seconde maximum

  // Envoyer les mouvements au serveur (avec throttling)
  const sendPaddleMovement = useCallback(() => {
    if (!socketRef.current || playerRole === 'spectator') return;

    const now = Date.now();
    if (now - lastMoveTime.current < MOVE_THROTTLE) return; // Throttle

    const keys = keysPressed.current;
    let shouldSend = false;
    let direction = '';

    if (playerRole === 'player1' || playerRole === 'player2') {
      if (keys.has('w') || keys.has('arrowup')) {
        direction = 'up';
        shouldSend = true;
      } else if (keys.has('s') || keys.has('arrowdown')) {
        direction = 'down';
        shouldSend = true;
      }
    }

    if (shouldSend) {
      socketRef.current.emit('movePaddle', { direction });
      lastMoveTime.current = now;
    }
  }, [playerRole]);

  // Dessiner le jeu
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Effacer le canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dessiner la ligne centrale
    ctx.setLineDash([5, 15]);
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dessiner les paddles
    ctx.fillStyle = '#ffffff';

    // Paddle joueur 1 (gauche)
    ctx.fillRect(0, gameState.paddles.player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Paddle joueur 2 (droite)
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, gameState.paddles.player2.y, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Dessiner la balle
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(gameState.ball.x, gameState.ball.y, BALL_SIZE, BALL_SIZE);

    // Dessiner les scores
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';

    // Score joueur 1
    ctx.fillText(
      gameState.score.player1.toString(),
      CANVAS_WIDTH / 4,
      60
    );

    // Score joueur 2
    ctx.fillText(
      gameState.score.player2.toString(),
      (3 * CANVAS_WIDTH) / 4,
      60
    );

    // Afficher les noms des joueurs
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';

    // Nom joueur 1 (gauche)
    ctx.fillText(
      gameState.players?.player1?.name || 'En attente...',
      CANVAS_WIDTH / 4,
      100
    );

    // Nom joueur 2 (droite)
    ctx.fillText(
      gameState.players?.player2?.name || 'En attente...',
      (3 * CANVAS_WIDTH) / 4,
      100
    );

    // Afficher le statut du jeu
    if (gameState.gameStatus === 'waiting') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('En attente des joueurs...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (gameState.gameStatus === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (gameState.gameStatus === 'finished') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const winner = gameState.score.player1 > gameState.score.player2 ? 'Joueur 1' : 'Joueur 2';
      ctx.fillStyle = '#4caf50';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${winner} a gagné !`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // Montrer les contrôles pour les joueurs
    if (playerRole !== 'spectator' && gameState.gameStatus === 'playing') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      if (playerRole === 'player1') {
        ctx.fillText('Contrôles: W/S ou ↑/↓', 10, CANVAS_HEIGHT - 10);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText('Contrôles: W/S ou ↑/↓', CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
      }
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
      // Utiliser le nom de l'utilisateur connecté ou un nom par défaut
      const playerName = isSpectator ? undefined : user?.username || `Joueur ${Math.floor(Math.random() * 1000)}`;
      console.log(`🔵 WEBSOCKET: Émission joinGame avec gameId=${gameId}, isSpectator=${isSpectator}, playerName=${playerName}`);
      // Rejoindre le jeu
      socket.emit('joinGame', { gameId, isSpectator, playerName });
    });

    socket.on('gameJoined', (data: { role: string; gameState: GameState }) => {
      console.log(`🔵 WEBSOCKET: gameJoined reçu, role=${data.role}, gameStatus=${data.gameState.gameStatus}`);
      setPlayerRole(data.role as any);
      setGameState(data.gameState);
    });

    socket.on('gameStateUpdate', (newGameState: GameState) => {
      console.log(`🔵 WEBSOCKET: gameStateUpdate reçu, gameStatus=${newGameState.gameStatus}`);
      setGameState(newGameState);
    });

    socket.on('gameStarted', (gameState: GameState) => {
      console.log(`🔵 WEBSOCKET: gameStarted reçu, gameStatus=${gameState.gameStatus}`);
      setGameState(gameState);
    });

    socket.on('gameEnded', (data: { winner: string; finalScore: any }) => {
      console.log(`🔵 WEBSOCKET: gameEnded reçu, winner=${data.winner}`);
      onGameEnd?.(data.winner as any, data.finalScore);
    });

    socket.on('playersUpdate', (data: { players: any; spectatorCount: number }) => {
      console.log(`🔵 WEBSOCKET: playersUpdate reçu, players=`, data.players, `spectatorCount=${data.spectatorCount}`);
      setPlayers(data.players);
      setSpectatorCount(data.spectatorCount);
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
          <p>Utilisez <kbd>W</kbd>/<kbd>S</kbd> ou <kbd>↑</kbd>/<kbd>↓</kbd> pour bouger votre paddle</p>
        </div>
      )}
    </div>
  );
};

export default PongGame;