import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { GameService } from './game.service';

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

interface GameRoom {
  id: string;
  players: { player1?: string; player2?: string };
  playersNames: { player1?: string; player2?: string };
  spectators: Set<string>;
  gameState: GameState;
  lastUpdate: number;
  matchId?: number;
  rematchRequests: { player1?: boolean; player2?: boolean };
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('GameGateway');
  private gameRooms = new Map<string, GameRoom>();
  private playerToRoom = new Map<string, string>();

  constructor(private gameService: GameService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const roomId = this.playerToRoom.get(client.id);
    if (roomId) {
      this.leaveGame(client, roomId);
    }
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { gameId: string; isSpectator?: boolean; playerName?: string },
  ) {
    const { gameId, isSpectator = false, playerName } = data;
    const userName = playerName || `Joueur ${Math.floor(Math.random() * 1000)}`;

    this.logger.log(`🎮 JOIN: gameId=${gameId}, isSpectator=${isSpectator}, playerName=${playerName}, userName=${userName}`);

    // Vérifier si le jeu existe ou le créer
    let room = this.gameRooms.get(gameId);
    if (!room) {
      room = this.createGameRoom(gameId);
      this.gameRooms.set(gameId, room);
    }

    // Joindre la room
    client.join(gameId);

    if (isSpectator) {
      room.spectators.add(client.id);
      client.emit('gameJoined', {
        role: 'spectator',
        gameState: room.gameState,
      });
    } else {
      // Assigner le joueur
      if (!room.players.player1) {
        room.players.player1 = client.id;
        room.playersNames.player1 = userName;
        room.gameState.players.player1 = { name: userName, id: client.id };
        this.playerToRoom.set(client.id, gameId);
        this.logger.log(`🎮 PLAYER1 JOINED: userName=${userName}, gameState.players.player1.name=${room.gameState.players.player1.name}`);
        client.emit('gameJoined', {
          role: 'player1',
          gameState: room.gameState,
        });
      } else if (!room.players.player2) {
        room.players.player2 = client.id;
        room.playersNames.player2 = userName;
        room.gameState.players.player2 = { name: userName, id: client.id };
        this.playerToRoom.set(client.id, gameId);
        this.logger.log(`🎮 PLAYER2 JOINED: userName=${userName}, gameState.players.player2.name=${room.gameState.players.player2.name}`);
        client.emit('gameJoined', {
          role: 'player2',
          gameState: room.gameState,
        });

        // Démarrer le jeu quand 2 joueurs sont présents
        this.startGame(gameId);
      } else {
        // Déjà 2 joueurs, devenir spectateur
        room.spectators.add(client.id);
        client.emit('gameJoined', {
          role: 'spectator',
          gameState: room.gameState,
        });
      }
    }

    // Notifier tous les clients de la room
    this.server.to(gameId).emit('playersUpdate', {
      players: room.players,
      spectatorCount: room.spectators.size,
    });

    // Aussi envoyer une mise à jour du gameState pour que les noms soient mis à jour
    this.server.to(gameId).emit('gameStateUpdate', room.gameState);
  }

  @SubscribeMessage('movePaddle')
  handleMovePaddle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { direction: 'up' | 'down' },
  ) {
    const roomId = this.playerToRoom.get(client.id);
    if (!roomId) return;

    const room = this.gameRooms.get(roomId);
    if (!room || room.gameState.gameStatus !== 'playing') return;

    const isPlayer1 = room.players.player1 === client.id;
    const isPlayer2 = room.players.player2 === client.id;

    if (!isPlayer1 && !isPlayer2) return;

    const paddleSpeed = 15; // Augmenté pour suivre la balle plus rapide
    const paddleHeight = 100;
    const canvasHeight = 400;

    if (isPlayer1) {
      const currentY = room.gameState.paddles.player1.y;
      let newY = currentY;

      if (data.direction === 'up') {
        newY = Math.max(0, currentY - paddleSpeed);
      } else {
        newY = Math.min(canvasHeight - paddleHeight, currentY + paddleSpeed);
      }

      room.gameState.paddles.player1.y = newY;
    } else if (isPlayer2) {
      const currentY = room.gameState.paddles.player2.y;
      let newY = currentY;

      if (data.direction === 'up') {
        newY = Math.max(0, currentY - paddleSpeed);
      } else {
        newY = Math.min(canvasHeight - paddleHeight, currentY + paddleSpeed);
      }

      room.gameState.paddles.player2.y = newY;
    }

    // Diffuser l'état mis à jour
    this.server.to(roomId).emit('gameStateUpdate', room.gameState);
  }

  @SubscribeMessage('requestRematch')
  handleRequestRematch(@ConnectedSocket() client: Socket) {
    const roomId = this.playerToRoom.get(client.id);
    if (!roomId) return;

    const room = this.gameRooms.get(roomId);
    if (!room || room.gameState.gameStatus !== 'finished') return;

    const isPlayer1 = room.players.player1 === client.id;
    const isPlayer2 = room.players.player2 === client.id;

    if (!isPlayer1 && !isPlayer2) return;

    this.logger.log(`🔄 REMATCH REQUEST: roomId=${roomId}, from=${isPlayer1 ? 'player1' : 'player2'}`);

    // Marquer la demande de rematch
    if (isPlayer1) {
      room.rematchRequests.player1 = true;
    } else {
      room.rematchRequests.player2 = true;
    }

    // Notifier l'autre joueur de la demande
    const otherPlayerId = isPlayer1 ? room.players.player2 : room.players.player1;
    if (otherPlayerId) {
      this.server.to(otherPlayerId).emit('rematchRequested', {
        fromPlayer: isPlayer1 ? 'player1' : 'player2',
        fromName: isPlayer1 ? room.playersNames.player1 : room.playersNames.player2
      });
    }

    // Vérifier si les deux joueurs veulent un rematch
    if (room.rematchRequests.player1 && room.rematchRequests.player2) {
      this.startRematch(roomId);
    }
  }

  @SubscribeMessage('acceptRematch')
  handleAcceptRematch(@ConnectedSocket() client: Socket) {
    const roomId = this.playerToRoom.get(client.id);
    if (!roomId) return;

    const room = this.gameRooms.get(roomId);
    if (!room || room.gameState.gameStatus !== 'finished') return;

    const isPlayer1 = room.players.player1 === client.id;
    const isPlayer2 = room.players.player2 === client.id;

    if (!isPlayer1 && !isPlayer2) return;

    this.logger.log(`✅ REMATCH ACCEPTED: roomId=${roomId}, from=${isPlayer1 ? 'player1' : 'player2'}`);

    // Marquer l'acceptation
    if (isPlayer1) {
      room.rematchRequests.player1 = true;
    } else {
      room.rematchRequests.player2 = true;
    }

    // Vérifier si les deux joueurs ont accepté
    if (room.rematchRequests.player1 && room.rematchRequests.player2) {
      this.startRematch(roomId);
    }
  }

  @SubscribeMessage('declineRematch')
  handleDeclineRematch(@ConnectedSocket() client: Socket) {
    const roomId = this.playerToRoom.get(client.id);
    if (!roomId) return;

    const room = this.gameRooms.get(roomId);
    if (!room) return;

    this.logger.log(`❌ REMATCH DECLINED: roomId=${roomId}`);

    // Réinitialiser les demandes de rematch
    room.rematchRequests = { player1: false, player2: false };

    // Notifier tous les clients que le rematch a été refusé
    this.server.to(roomId).emit('rematchDeclined');
  }

  private startRematch(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    this.logger.log(`🔄 STARTING REMATCH: gameId=${gameId}`);

    // Réinitialiser l'état du jeu
    room.gameState = {
      ball: {
        x: 400,
        y: 200,
        velocityX: 8,
        velocityY: 6,
      },
      paddles: {
        player1: { y: 150 },
        player2: { y: 150 },
      },
      score: {
        player1: 0,
        player2: 0,
      },
      players: {
        player1: { name: room.playersNames.player1 || 'Joueur 1', id: room.players.player1 },
        player2: { name: room.playersNames.player2 || 'Joueur 2', id: room.players.player2 },
      },
      gameStatus: 'playing',
    };

    // Réinitialiser les demandes de rematch
    room.rematchRequests = { player1: false, player2: false };

    // Notifier le début du rematch
    this.server.to(gameId).emit('rematchStarted', room.gameState);

    // Démarrer la boucle de jeu
    this.startGameLoop(gameId);
  }

  private createGameRoom(gameId: string): GameRoom {
    return {
      id: gameId,
      players: {},
      playersNames: {},
      spectators: new Set(),
      rematchRequests: { player1: false, player2: false },
      gameState: {
        ball: {
          x: 400, // Centre du canvas (800/2)
          y: 200, // Centre du canvas (400/2)
          velocityX: 8, // Vitesse rapide pour un jeu dynamique
          velocityY: 6,
        },
        paddles: {
          player1: { y: 150 }, // Centre - paddleHeight/2
          player2: { y: 150 },
        },
        score: {
          player1: 0,
          player2: 0,
        },
        players: {
          player1: { name: 'En attente...', id: undefined },
          player2: { name: 'En attente...', id: undefined },
        },
        gameStatus: 'waiting',
      },
      lastUpdate: Date.now(),
    };
  }

  private startGame(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    room.gameState.gameStatus = 'playing';
    this.server.to(gameId).emit('gameStarted', room.gameState);

    // Démarrer la boucle de jeu
    this.startGameLoop(gameId);
  }

  private startGameLoop(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room || room.gameState.gameStatus !== 'playing') return;

    const gameLoop = () => {
      if (!this.gameRooms.has(gameId)) return;

      const currentRoom = this.gameRooms.get(gameId);
      if (!currentRoom || currentRoom.gameState.gameStatus !== 'playing')
        return;

      this.updateGamePhysics(currentRoom);
      this.server.to(gameId).emit('gameStateUpdate', currentRoom.gameState);

      // Vérifier si le jeu est terminé
      if (
        currentRoom.gameState.score.player1 >= 5 ||
        currentRoom.gameState.score.player2 >= 5
      ) {
        this.endGame(gameId);
        return;
      }

      // Continuer la boucle
      setTimeout(gameLoop, 1000 / 30); // 30 FPS pour réduire la charge réseau
    };

    gameLoop();
  }

  private updateGamePhysics(room: GameRoom) {
    const { ball, paddles, score } = room.gameState;
    const canvasWidth = 800;
    const canvasHeight = 400;
    const paddleWidth = 10;
    const paddleHeight = 100;
    const ballSize = 10;

    // Mettre à jour la position de la balle
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Collision avec le haut et le bas
    if (ball.y <= 0 || ball.y >= canvasHeight - ballSize) {
      ball.velocityY = -ball.velocityY;
    }

    // Collision avec les paddles
    // Paddle joueur 1 (gauche)
    if (
      ball.x <= paddleWidth &&
      ball.y >= paddles.player1.y &&
      ball.y <= paddles.player1.y + paddleHeight
    ) {
      ball.velocityX = -ball.velocityX;
      ball.x = paddleWidth;
    }

    // Paddle joueur 2 (droite)
    if (
      ball.x >= canvasWidth - paddleWidth - ballSize &&
      ball.y >= paddles.player2.y &&
      ball.y <= paddles.player2.y + paddleHeight
    ) {
      ball.velocityX = -ball.velocityX;
      ball.x = canvasWidth - paddleWidth - ballSize;
    }

    // Scoring
    if (ball.x < 0) {
      // Point pour le joueur 2
      score.player2++;
      this.resetBall(ball, canvasWidth, canvasHeight);
    } else if (ball.x > canvasWidth) {
      // Point pour le joueur 1
      score.player1++;
      this.resetBall(ball, canvasWidth, canvasHeight);
    }
  }

  private resetBall(ball: any, canvasWidth: number, canvasHeight: number) {
    ball.x = canvasWidth / 2;
    ball.y = canvasHeight / 2;
    ball.velocityX = -ball.velocityX; // Changer de direction
    ball.velocityY = Math.random() > 0.5 ? 6 : -6; // Vitesse rapide pour un jeu dynamique
  }

  private async endGame(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    room.gameState.gameStatus = 'finished';

    const winner = room.gameState.score.player1 > room.gameState.score.player2 ? 'player1' : 'player2';

    this.logger.log(`🏆 GAME END: winner=${winner}, player1=${room.gameState.players.player1?.name}, player2=${room.gameState.players.player2?.name}`);

    // Notifier la fin du jeu
    this.server.to(gameId).emit('gameEnded', {
      winner,
      finalScore: room.gameState.score,
    });

    // Sauvegarder le résultat si c'est un match officiel
    if (room.matchId) {
      try {
        await this.gameService.finishMatch(room.matchId, {
          player1Score: room.gameState.score.player1,
          player2Score: room.gameState.score.player2,
        });
      } catch (error) {
        this.logger.error('Error saving match result:', error);
      }
    }

    // Nettoyer la room après 30 secondes
    setTimeout(() => {
      this.gameRooms.delete(gameId);
      // Nettoyer les mappings des joueurs
      for (const [playerId, roomId] of this.playerToRoom.entries()) {
        if (roomId === gameId) {
          this.playerToRoom.delete(playerId);
        }
      }
    }, 30000);
  }

  private leaveGame(client: Socket, gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    // Retirer des spectateurs
    room.spectators.delete(client.id);

    // Si c'est un joueur, marquer comme déconnecté
    if (room.players.player1 === client.id) {
      room.players.player1 = undefined;
      room.playersNames.player1 = undefined;
      room.gameState.players.player1 = { name: 'En attente...', id: undefined };
      room.gameState.gameStatus = 'paused';
    } else if (room.players.player2 === client.id) {
      room.players.player2 = undefined;
      room.playersNames.player2 = undefined;
      room.gameState.players.player2 = { name: 'En attente...', id: undefined };
      room.gameState.gameStatus = 'paused';
    }

    this.playerToRoom.delete(client.id);
    client.leave(gameId);

    // Notifier les autres clients
    this.server.to(gameId).emit('playersUpdate', {
      players: room.players,
      spectatorCount: room.spectators.size,
    });
  }


}
