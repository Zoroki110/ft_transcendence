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
import { UsersService } from '../users/users.service';

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
  playersUserIds: { player1?: number; player2?: number };
  spectators: Set<string>;
  gameState: GameState;
  lastUpdate: number;
  matchId?: number;
  rematchRequests: { player1?: boolean; player2?: boolean };
  statsUpdated?: boolean;
  gameLoopId?: NodeJS.Timeout;
  rematchCount?: number;
  disconnectTimers?: { player1?: NodeJS.Timeout; player2?: NodeJS.Timeout };
  endedByForfeit?: boolean;
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
  public gameRooms = new Map<string, GameRoom>(); // Public pour permettre l'accès depuis TournamentsService
  private playerToRoom = new Map<string, string>();
  private userToSocket = new Map<number, string>(); // userId -> socketId

  constructor(
    private gameService: GameService,
    private usersService: UsersService,
  ) {
    // Établir la référence bidirectionnelle pour éviter les dépendances circulaires
    this.gameService.setGameGateway(this);
  }

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

  @SubscribeMessage('registerUser')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const { userId } = data;
    this.userToSocket.set(userId, client.id);
    this.logger.log(`👤 User registered: userId=${userId}, socketId=${client.id}`);
    return { success: true };
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { gameId: string; isSpectator?: boolean; playerName?: string; userId?: number },
  ) {
    const { gameId, isSpectator = false, playerName, userId } = data;
    const userName = playerName || `Joueur ${Math.floor(Math.random() * 1000)}`;

    this.logger.log(`🎮 JOIN: gameId=${gameId}, isSpectator=${isSpectator}, playerName=${playerName}, userName=${userName}, userId=${userId}`);

    // Enregistrer l'utilisateur si fourni
    if (userId) {
      this.userToSocket.set(userId, client.id);
    }

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
      // Vérifier si c'est une reconnexion d'un joueur déconnecté
      const isReconnectingPlayer1 = !room.players.player1 && room.playersUserIds.player1 === userId;
      const isReconnectingPlayer2 = !room.players.player2 && room.playersUserIds.player2 === userId;

      // Assigner le joueur - prioriser la détection par userId pour les tournois
      if (room.playersUserIds.player1 === userId) {
        // Ce joueur doit être player1
        room.players.player1 = client.id;
        room.playersNames.player1 = userName;
        room.gameState.players.player1 = { name: userName, id: client.id };
        this.playerToRoom.set(client.id, gameId);
        this.logger.log(`🎮 TOURNAMENT PLAYER1 JOINED: userName=${userName}, userId=${userId}`);

        client.emit('gameJoined', {
          role: 'player1',
          gameState: room.gameState,
        });
      } else if (room.playersUserIds.player2 === userId) {
        // Ce joueur doit être player2
        room.players.player2 = client.id;
        room.playersNames.player2 = userName;
        room.gameState.players.player2 = { name: userName, id: client.id };
        this.playerToRoom.set(client.id, gameId);
        this.logger.log(`🎮 TOURNAMENT PLAYER2 JOINED: userName=${userName}, userId=${userId}`);

        client.emit('gameJoined', {
          role: 'player2',
          gameState: room.gameState,
        });
      } else if (!room.players.player1 && !room.playersUserIds.player1) {
        // Room normale de matchmaking - assignation libre
        room.players.player1 = client.id;
        room.playersNames.player1 = userName;
        room.playersUserIds.player1 = userId;
        room.gameState.players.player1 = { name: userName, id: client.id };
        this.playerToRoom.set(client.id, gameId);
        this.logger.log(`🎮 MATCHMAKING PLAYER1 JOINED: userName=${userName}, userId=${userId}`);

        client.emit('gameJoined', {
          role: 'player1',
          gameState: room.gameState,
        });
      } else if (!room.players.player2 && !room.playersUserIds.player2) {
        // Room normale de matchmaking - assignation libre
        room.players.player2 = client.id;
        room.playersNames.player2 = userName;
        room.playersUserIds.player2 = userId;
        room.gameState.players.player2 = { name: userName, id: client.id };
        this.playerToRoom.set(client.id, gameId);
        this.logger.log(`🎮 MATCHMAKING PLAYER2 JOINED: userName=${userName}, userId=${userId}`);

        client.emit('gameJoined', {
          role: 'player2',
          gameState: room.gameState,
        });
      }

      // Si aucun rôle assigné, devenir spectateur
      if (!room.players.player1 || room.players.player1 !== client.id) {
        if (!room.players.player2 || room.players.player2 !== client.id) {
          // Pas assigné comme joueur, devenir spectateur
          room.spectators.add(client.id);
          client.emit('gameJoined', {
            role: 'spectator',
            gameState: room.gameState,
          });
        }
      }

      // Démarrer le jeu quand 2 joueurs sont présents ET connectés
      this.logger.log(`🔍 DEBUG AUTOSTART: gameId=${gameId}, status=${room.gameState.gameStatus}, player1=${!!room.players.player1}, player2=${!!room.players.player2}`);
      this.logger.log(`🔍 DEBUG PLAYERS: player1=${room.players.player1}, player2=${room.players.player2}`);
      
      if (room.gameState.gameStatus === 'waiting' && room.players.player1 && room.players.player2) {
        this.logger.log(`🎮 BOTH PLAYERS CONNECTED: Starting game ${gameId}`);
        this.startGame(gameId);
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

    const paddleSpeed = 18; // Augmenté pour suivre la balle plus rapide
    const paddleHeight = 120; // Augmenté pour correspondre au frontend
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

    // Empêcher les rematchs pour les parties de tournoi
    if (roomId.includes('game_tournament_')) {
      this.logger.log(`❌ REMATCH BLOCKED: Tournament matches cannot be rematched (roomId: ${roomId})`);
      client.emit('rematchBlocked', {
        message: 'Les rematchs ne sont pas autorisés dans les tournois'
      });
      return;
    }

    const isPlayer1 = room.players.player1 === client.id;
    const isPlayer2 = room.players.player2 === client.id;

    if (!isPlayer1 && !isPlayer2) return;

    // Éviter les demandes multiples du même joueur
    const currentPlayerRequest = isPlayer1 ? room.rematchRequests.player1 : room.rematchRequests.player2;
    if (currentPlayerRequest) {
      this.logger.log(`⚠️ REMATCH REQUEST: Player ${isPlayer1 ? 'player1' : 'player2'} already requested rematch for room ${roomId}`);
      return;
    }

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

    // Empêcher les rematchs pour les parties de tournoi
    if (roomId.includes('game_tournament_')) {
      this.logger.log(`❌ REMATCH BLOCKED: Tournament matches cannot be rematched (roomId: ${roomId})`);
      client.emit('rematchBlocked', {
        message: 'Les rematchs ne sont pas autorisés dans les tournois'
      });
      return;
    }

    const isPlayer1 = room.players.player1 === client.id;
    const isPlayer2 = room.players.player2 === client.id;

    if (!isPlayer1 && !isPlayer2) return;

    // Éviter les acceptations multiples du même joueur
    const currentPlayerRequest = isPlayer1 ? room.rematchRequests.player1 : room.rematchRequests.player2;
    if (currentPlayerRequest) {
      this.logger.log(`⚠️ REMATCH ACCEPT: Player ${isPlayer1 ? 'player1' : 'player2'} already accepted rematch for room ${roomId}`);
      return;
    }

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

  @SubscribeMessage('sendChatMessage')
  handleSendChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { message: string; username?: string },
  ) {
    const roomId = this.playerToRoom.get(client.id);
    if (!roomId) return;

    const room = this.gameRooms.get(roomId);
    if (!room) return;

    const { message, username } = data;
    if (!message || !message.trim()) return;

    this.logger.log(`💬 CHAT MESSAGE: roomId=${roomId}, username=${username}, message=${message.substring(0, 50)}...`);

    // Diffuser le message à tous les clients de la room
    this.server.to(roomId).emit('chatMessage', {
      username: username || 'Anonyme',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      senderId: client.id
    });
  }

  // === LOBBY MANAGEMENT ===
  
  @SubscribeMessage('joinLobby')
  handleJoinLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; userId: number; username: string },
  ) {
    const { lobbyId, userId, username } = data;
    
    this.logger.log(`🏓 LOBBY JOIN WEBSOCKET: lobbyId=${lobbyId}, userId=${userId}, username=${username}`);
    
    // Joindre la room WebSocket pour ce lobby
    client.join(lobbyId);
    
    // Notifier les autres participants du lobby qu'un joueur s'est connecté
    client.to(lobbyId).emit('lobbyPlayerConnected', {
      userId,
      username,
      message: `${username} est maintenant connecté au lobby`
    });
  }

  @SubscribeMessage('leaveLobby')
  handleLeaveLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { lobbyId: string; userId: number; username: string },
  ) {
    const { lobbyId, userId, username } = data;
    
    this.logger.log(`🏓 LOBBY LEAVE WEBSOCKET: lobbyId=${lobbyId}, userId=${userId}, username=${username}`);
    
    // Quitter la room WebSocket
    client.leave(lobbyId);
    
    // Notifier les autres participants
    client.to(lobbyId).emit('lobbyPlayerDisconnected', {
      userId,
      username,
      message: `${username} a quitté le lobby`
    });
  }

  // Méthode pour notifier qu'un lobby est maintenant complet depuis le service
  notifyLobbyComplete(lobbyId: string, gameUrl: string) {
    this.logger.log(`🎯 LOBBY COMPLETE NOTIFICATION: lobbyId=${lobbyId}, gameUrl=${gameUrl}`);
    
    // Notifier tous les clients connectés à ce lobby
    this.server.to(lobbyId).emit('lobbyComplete', {
      lobbyId,
      gameUrl,
      message: 'Le lobby est complet ! Redirection vers le jeu...'
    });
  }

  // === TOURNAMENT MANAGEMENT ===

  @SubscribeMessage('joinTournament')
  handleJoinTournament(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: number; userId: number; username: string },
  ) {
    const { tournamentId, userId, username } = data;
    const tournamentRoom = `tournament_${tournamentId}`;
    
    this.logger.log(`🏆 TOURNAMENT JOIN WEBSOCKET: tournamentId=${tournamentId}, userId=${userId}, username=${username}`);
    
    // Joindre la room WebSocket pour ce tournoi
    client.join(tournamentRoom);
    
    // Notifier les autres participants du tournoi
    client.to(tournamentRoom).emit('tournamentPlayerConnected', {
      userId,
      username,
      message: `${username} a rejoint le tournoi`
    });
  }

  @SubscribeMessage('leaveTournament')
  handleLeaveTournament(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tournamentId: number; userId: number; username: string },
  ) {
    const { tournamentId, userId, username } = data;
    const tournamentRoom = `tournament_${tournamentId}`;
    
    this.logger.log(`🏆 TOURNAMENT LEAVE WEBSOCKET: tournamentId=${tournamentId}, userId=${userId}, username=${username}`);
    
    // Quitter la room WebSocket
    client.leave(tournamentRoom);
    
    // Notifier les autres participants
    client.to(tournamentRoom).emit('tournamentPlayerDisconnected', {
      userId,
      username,
      message: `${username} a quitté le tournoi`
    });
  }

  // Méthode pour notifier qu'un défi a été accepté
  notifyChallengeAccepted(challengerId: number, gameId: string, opponentUsername: string) {
    const socketId = this.userToSocket.get(challengerId);

    if (socketId) {
      this.logger.log(`🔔 Sending challenge accepted notification to challenger (userId: ${challengerId}, socketId: ${socketId})`);
      this.server.to(socketId).emit('challengeAccepted', {
        gameId,
        gameUrl: `/game/${gameId}`,
        opponentUsername,
        message: `${opponentUsername} a accepté votre défi ! Redirection vers le match...`,
      });
    } else {
      this.logger.warn(`⚠️ Cannot notify challenger ${challengerId}: not connected to WebSocket`);
    }
  }

  // Méthode pour notifier que le tournoi a commencé et les brackets sont générés
  notifyTournamentStarted(tournamentId: number, matches: any[]) {
    const tournamentRoom = `tournament_${tournamentId}`;
    
    this.logger.log(`🏆 TOURNAMENT STARTED NOTIFICATION: tournamentId=${tournamentId}, matches=${matches.length}`);
    
    // Créer la liste des matchs avec les infos des joueurs pour redirection
    const matchNotifications = matches.map(match => ({
      matchId: match.id,
      player1Id: match.player1.id,
      player2Id: match.player2.id,
      player1Username: match.player1.username,
      player2Username: match.player2.username,
      gameUrl: `/game/game_tournament_${tournamentId}_match_${match.id}`,
      round: match.round,
      bracketPosition: match.bracketPosition
    }));
    
    // Notifier tous les clients connectés à ce tournoi
    this.server.to(tournamentRoom).emit('tournamentStarted', {
      tournamentId,
      message: 'Le tournoi a commencé ! Les brackets ont été générés.',
      matches: matchNotifications
    });

    // Notifier individuellement chaque joueur de son match
    matchNotifications.forEach(match => {
      // Notifier player1
      this.server.emit('tournamentMatchAssigned', {
        tournamentId,
        matchId: match.matchId,
        opponentId: match.player2Id,
        opponentUsername: match.player2Username,
        gameUrl: match.gameUrl,
        round: match.round,
        message: `Votre premier match vous attend contre ${match.player2Username} !`
      });

      // Notifier player2
      this.server.emit('tournamentMatchAssigned', {
        tournamentId,
        matchId: match.matchId,
        opponentId: match.player1Id,
        opponentUsername: match.player1Username,
        gameUrl: match.gameUrl,
        round: match.round,
        message: `Votre premier match vous attend contre ${match.player1Username} !`
      });
    });
  }

  private startRematch(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    // Incrémenter le compteur de rematchs
    room.rematchCount = (room.rematchCount || 0) + 1;

    this.logger.log(`🔄 STARTING REMATCH #${room.rematchCount}: gameId=${gameId}`);

    // S'assurer que l'ancienne boucle de jeu est arrêtée
    if (room.gameLoopId) {
      this.logger.log(`🔴 REMATCH: Stopping previous game loop for ${gameId}`);
      clearInterval(room.gameLoopId);
      room.gameLoopId = undefined;
    }

    // Réinitialiser complètement l'état du jeu
    room.gameState = {
      ball: {
        x: 400,
        y: 200,
        velocityX: 12,
        velocityY: 9,
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
      gameStatus: 'waiting', // Commencer en 'waiting' puis passer à 'playing'
    };

    // Réinitialiser les demandes de rematch
    room.rematchRequests = { player1: false, player2: false };

    // Réinitialiser le flag des stats pour permettre de nouvelles stats
    room.statsUpdated = false;

    // Réinitialiser le timestamp
    room.lastUpdate = Date.now();

    this.logger.log(`🔄 REMATCH: Game state reset for ${gameId}, players: ${room.playersNames.player1} vs ${room.playersNames.player2}`);

    // Notifier le début du rematch
    this.server.to(gameId).emit('rematchStarted', room.gameState);

    // Petit délai pour laisser le frontend se synchroniser, puis démarrer le jeu
    setTimeout(() => {
      const currentRoom = this.gameRooms.get(gameId);
      if (currentRoom && currentRoom.gameState.gameStatus === 'waiting') {
        currentRoom.gameState.gameStatus = 'playing';
        this.logger.log(`🎮 REMATCH: Starting game loop for ${gameId}`);

        // Notifier que le jeu démarre vraiment
        this.server.to(gameId).emit('gameStarted', currentRoom.gameState);

        this.startGameLoop(gameId);
      }
    }, 100);
  }

  private createGameRoom(gameId: string): GameRoom {
    return {
      id: gameId,
      players: {},
      playersNames: {},
      playersUserIds: {},
      spectators: new Set(),
      rematchRequests: { player1: false, player2: false },
      rematchCount: 0,
      gameState: {
        ball: {
          x: 400, // Centre du canvas (800/2)
          y: 200, // Centre du canvas (400/2)
          velocityX: 12, // Vitesse augmentée pour un jeu plus rapide et dynamique
          velocityY: 9,
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

  // Créer une room spécifique pour un match de tournoi
  createTournamentRoom(gameId: string, matchId: number, player1: any, player2: any): GameRoom {
    this.logger.log(`🔍 DEBUG TOURNAMENT ROOM: Creating room ${gameId} with player1=${player1.username} (id=${player1.id}), player2=${player2.username} (id=${player2.id})`);

    const room: GameRoom = {
      id: gameId,
      players: {},
      playersNames: {
        player1: player1.username,
        player2: player2.username,
      },
      playersUserIds: {
        player1: player1.id,
        player2: player2.id,
      },
      spectators: new Set(),
      rematchRequests: { player1: false, player2: false },
      rematchCount: 0,
      matchId: matchId, // Lier au match de tournoi
      gameState: {
        ball: {
          x: 400,
          y: 200,
          velocityX: 12,
          velocityY: 9,
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
          player1: { name: player1.username, id: player1.id.toString() },
          player2: { name: player2.username, id: player2.id.toString() },
        },
        gameStatus: 'waiting',
      },
      lastUpdate: Date.now(),
    };

    this.gameRooms.set(gameId, room);
    this.logger.log(`🏆 Tournament room created: ${gameId} for match ${matchId}`);

    return room;
  }

  // Créer une room spécifique pour un défi entre amis
  createChallengeGameRoom(
    gameId: string,
    player1Id: number,
    player2Id: number,
    player1Name: string,
    player2Name: string,
  ): GameRoom {
    this.logger.log(`🎮 Creating challenge room: ${gameId}`);
    this.logger.log(`🎮 Player1: ${player1Name} (ID: ${player1Id}), Player2: ${player2Name} (ID: ${player2Id})`);

    const room: GameRoom = {
      id: gameId,
      players: {},
      playersNames: {
        player1: player1Name,
        player2: player2Name,
      },
      playersUserIds: {
        player1: player1Id,
        player2: player2Id,
      },
      spectators: new Set(),
      rematchRequests: { player1: false, player2: false },
      rematchCount: 0,
      gameState: {
        ball: {
          x: 400,
          y: 200,
          velocityX: 12,
          velocityY: 9,
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
          player1: { name: player1Name, id: player1Id.toString() },
          player2: { name: player2Name, id: player2Id.toString() },
        },
        gameStatus: 'waiting',
      },
      lastUpdate: Date.now(),
    };

    this.gameRooms.set(gameId, room);
    this.logger.log(`🎮 Challenge room created: ${gameId}`);

    return room;
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
    if (!room) {
      this.logger.warn(`🔴 GAME LOOP: Cannot start, room ${gameId} not found`);
      return;
    }

    if (room.gameState.gameStatus !== 'playing') {
      this.logger.warn(`🔴 GAME LOOP: Cannot start, game status is ${room.gameState.gameStatus} for ${gameId}`);
      return;
    }

    // Stocker l'ID de l'intervalle pour pouvoir l'arrêter proprement
    if (room.gameLoopId) {
      this.logger.log(`🔄 GAME LOOP: Clearing existing loop for ${gameId}`);
      clearInterval(room.gameLoopId);
      room.gameLoopId = undefined;
    }

    const gameLoop = () => {
      if (!this.gameRooms.has(gameId)) {
        this.logger.warn(`🔴 GAME LOOP: Room ${gameId} no longer exists, stopping loop`);
        return;
      }

      const currentRoom = this.gameRooms.get(gameId);
      if (!currentRoom) {
        this.logger.warn(`🔴 GAME LOOP: Room ${gameId} is null, stopping loop`);
        return;
      }

      // Si le jeu est en pause mais que les deux joueurs sont présents, reprendre automatiquement
      if (currentRoom.gameState.gameStatus === 'paused' &&
          currentRoom.players.player1 && currentRoom.players.player2) {
        this.logger.log(`🔄 GAME LOOP: Resuming paused game ${gameId}`);
        currentRoom.gameState.gameStatus = 'playing';
        this.server.to(gameId).emit('gameResumed', currentRoom.gameState);
      }

      // Continuer la boucle même si le jeu est en pause (pour permettre la reprise automatique)
      if (currentRoom.gameState.gameStatus === 'finished') {
        this.logger.log(`🏁 GAME LOOP: Game ${gameId} finished, stopping loop`);
        if (currentRoom.gameLoopId) {
          clearInterval(currentRoom.gameLoopId);
          currentRoom.gameLoopId = undefined;
        }
        return;
      }

      // Mettre à jour la physique seulement si le jeu est en cours
      if (currentRoom.gameState.gameStatus === 'playing') {
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
      }
    };

    // Utiliser setInterval au lieu de setTimeout récursif pour plus de stabilité
    room.gameLoopId = setInterval(gameLoop, 1000 / 30); // 30 FPS
    this.logger.log(`🎮 GAME LOOP: Started for game ${gameId} with interval ID ${room.gameLoopId}`);
  }

  private updateGamePhysics(room: GameRoom) {
    const { ball, paddles, score } = room.gameState;
    const canvasWidth = 800;
    const canvasHeight = 400;
    const paddleWidth = 16;  // Augmenté pour correspondre au frontend
    const paddleHeight = 120; // Augmenté pour correspondre au frontend
    const ballSize = 16;      // Augmenté pour correspondre au frontend

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
    // Augmenter la vitesse après chaque point pour un jeu plus dynamique
    const speedMultiplier = Math.abs(ball.velocityX) < 15 ? 1.1 : 1; // Accélérer jusqu'à une limite
    ball.velocityX = -(ball.velocityX * speedMultiplier); // Changer de direction et accélérer
    ball.velocityY = Math.random() > 0.5 ? 9 : -9; // Vitesse augmentée pour un jeu plus rapide
  }

  private async endGame(gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    // Éviter les appels multiples d'endGame
    if (room.gameState.gameStatus === 'finished') {
      this.logger.log(`⚠️ ENDGAME ALREADY CALLED: gameId=${gameId}`);
      return;
    }

    room.gameState.gameStatus = 'finished';

    // Déterminer si c'est une partie de tournoi ou de matchmaking
    const isTournamentMatch = gameId.includes('game_tournament_') && gameId.includes('match_');
    let tournamentId: number | null = null;
    let matchId: number | null = null;

    if (isTournamentMatch) {
      // Extraire l'ID du tournoi et du match depuis le gameId
      const parts = gameId.split('_');
      tournamentId = parseInt(parts[2]); // game_tournament_123_match_456 -> 123
      matchId = parseInt(parts[4]); // game_tournament_123_match_456 -> 456
      this.logger.log(`🏆 TOURNAMENT MATCH END: gameId=${gameId}, tournamentId=${tournamentId}, matchId=${matchId}`);
    }

    // Arrêter la boucle de jeu proprement
    if (room.gameLoopId) {
      clearInterval(room.gameLoopId);
      room.gameLoopId = undefined;
      this.logger.log(`🔴 GAME LOOP: Stopped for game ${gameId}`);
    }

    // Réinitialiser les demandes de rematch pour permettre de nouveaux rematchs
    room.rematchRequests = { player1: false, player2: false };
    this.logger.log(`🔄 REMATCH: Requests reset for game ${gameId}`);

    // Déterminer le gagnant en fonction des scores réels
    const winner = room.gameState.score.player1 > room.gameState.score.player2 ? 'player1' : 'player2';
    
    this.logger.log(`🏆 WINNER DETERMINATION: score1=${room.gameState.score.player1}, score2=${room.gameState.score.player2}, winner=${winner}`);

    this.logger.log(`🏆 GAME END: winner=${winner}, player1=${room.gameState.players.player1?.name}, player2=${room.gameState.players.player2?.name}`);

    // Mettre à jour les statistiques des joueurs
    const player1UserId = room.playersUserIds.player1;
    const player2UserId = room.playersUserIds.player2;

    this.logger.log(`🔍 DEBUG STATS: winner=${winner}, player1UserId=${player1UserId}, player2UserId=${player2UserId}`);
    this.logger.log(`🔍 DEBUG SCORES: player1Score=${room.gameState.score.player1}, player2Score=${room.gameState.score.player2}`);

    if (player1UserId && player2UserId && !room.statsUpdated) {
      try {
        const winnerId = winner === 'player1' ? player1UserId : player2UserId;
        const loserId = winner === 'player1' ? player2UserId : player1UserId;

        this.logger.log(`🎯 ATTRIBUTION: winner=${winner} → winnerId=${winnerId}, loserId=${loserId}`);
        this.logger.log(`🎯 DETAILS: player1='${room.gameState.players.player1?.name}' (id=${player1UserId}), player2='${room.gameState.players.player2?.name}' (id=${player2UserId})`);

        await this.usersService.updateGameStats(winnerId, loserId);
        room.statsUpdated = true; // Marquer les stats comme mises à jour
        this.logger.log(`📊 STATS UPDATED: winner=${winnerId}, loser=${loserId}`);
      } catch (error) {
        this.logger.error('Error updating user stats:', error);
      }
    } else if (room.statsUpdated) {
      this.logger.log(`⚠️ STATS ALREADY UPDATED: gameId=${gameId}`);
    } else {
      this.logger.warn(`Cannot update stats: missing user IDs - player1UserId=${player1UserId}, player2UserId=${player2UserId}`);
    }

    // Notifier la fin du jeu différemment selon le type de partie
    if (isTournamentMatch && tournamentId && matchId) {
      // Récupérer les vrais IDs depuis la base de données pour éviter les erreurs d'attribution
      try {
        const match = await this.gameService.findOneMatch(matchId);
        const realPlayer1Id = match.player1.id;
        const realPlayer2Id = match.player2.id;
        
        // CORRECTION CRUCIALE : Déterminer le vrai gagnant en mappant room vers DB
        let realWinner: string;
        let realWinnerId: number;
        
        // Qui a le meilleur score dans la room ?
        const roomPlayer1Score = room.gameState.score.player1;
        const roomPlayer2Score = room.gameState.score.player2;
        
        if (roomPlayer1Score > roomPlayer2Score) {
          // Le player1 de la ROOM a gagné, mais qui est-ce en DB ?
          const roomWinnerUserId = room.playersUserIds.player1;
          if (roomWinnerUserId === realPlayer1Id) {
            realWinner = 'player1';
            realWinnerId = realPlayer1Id;
          } else {
            realWinner = 'player2';
            realWinnerId = realPlayer2Id;
          }
        } else {
          // Le player2 de la ROOM a gagné, mais qui est-ce en DB ?
          const roomWinnerUserId = room.playersUserIds.player2;
          if (roomWinnerUserId === realPlayer1Id) {
            realWinner = 'player1';
            realWinnerId = realPlayer1Id;
          } else {
            realWinner = 'player2';
            realWinnerId = realPlayer2Id;
          }
        }
        
        this.logger.log(`🏆 REAL PLAYER IDS: DB player1=${realPlayer1Id}, DB player2=${realPlayer2Id}`);
        this.logger.log(`🏆 ROOM PLAYER IDS: room player1=${room.playersUserIds.player1}, room player2=${room.playersUserIds.player2}`);
        this.logger.log(`🏆 ROOM SCORES: player1=${roomPlayer1Score}, player2=${roomPlayer2Score}`);
        this.logger.log(`🏆 WINNER MAPPING: room winner has userId=${roomPlayer1Score > roomPlayer2Score ? room.playersUserIds.player1 : room.playersUserIds.player2}`);
        this.logger.log(`🏆 REAL WINNER: ${realWinner} (userId=${realWinnerId})`);
        
        // Pour les parties de tournoi : redirection vers le lobby du tournoi
        this.server.to(gameId).emit('tournamentMatchEnded', {
          winner: realWinner, // Utiliser le vrai winner mappé
          finalScore: room.gameState.score,
          tournamentId,
          matchId,
          redirectUrl: `/tournaments/${tournamentId}`,
          message: 'Match terminé ! Retour au lobby du tournoi...',
          player1Id: realPlayer1Id,
          player2Id: realPlayer2Id
        });
        
        // L'avancement sera géré par le frontend pour éviter les dépendances circulaires
      } catch (error) {
        this.logger.error(`❌ Error getting real player IDs for match ${matchId}:`, error);
        // Fallback aux IDs de la room
        this.server.to(gameId).emit('tournamentMatchEnded', {
          winner,
          finalScore: room.gameState.score,
          tournamentId,
          matchId,
          redirectUrl: `/tournaments/${tournamentId}`,
          message: 'Match terminé ! Retour au lobby du tournoi...',
          player1Id: room.playersUserIds.player1,
          player2Id: room.playersUserIds.player2
        });
      }
      
      // Notifier aussi la room du tournoi
      const tournamentRoom = `tournament_${tournamentId}`;
      this.server.to(tournamentRoom).emit('tournamentMatchResult', {
        matchId,
        winner: winner === 'player1' ? room.gameState.players.player1?.name : room.gameState.players.player2?.name,
        finalScore: room.gameState.score,
        player1: room.gameState.players.player1?.name,
        player2: room.gameState.players.player2?.name
      });
    } else {
      // Pour les parties de matchmaking classiques : comportement normal avec rematch
      this.server.to(gameId).emit('gameEnded', {
        winner,
        finalScore: room.gameState.score,
        endedByForfeit: room.endedByForfeit || false,
      });
    }

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
      const roomToDelete = this.gameRooms.get(gameId);
      if (roomToDelete) {
        // Nettoyer la boucle de jeu
        if (roomToDelete.gameLoopId) {
          clearInterval(roomToDelete.gameLoopId);
        }
        // Nettoyer les timers de déconnexion
        if (roomToDelete.disconnectTimers) {
          if (roomToDelete.disconnectTimers.player1) {
            clearTimeout(roomToDelete.disconnectTimers.player1);
          }
          if (roomToDelete.disconnectTimers.player2) {
            clearTimeout(roomToDelete.disconnectTimers.player2);
          }
        }
      }
      this.gameRooms.delete(gameId);
      // Nettoyer les mappings des joueurs
      for (const [playerId, roomId] of this.playerToRoom.entries()) {
        if (roomId === gameId) {
          this.playerToRoom.delete(playerId);
        }
      }
      this.logger.log(`🧹 CLEANUP: Game room ${gameId} cleaned up`);
    }, 30000);
  }

  private leaveGame(client: Socket, gameId: string) {
    const room = this.gameRooms.get(gameId);
    if (!room) return;

    // Retirer des spectateurs
    room.spectators.delete(client.id);

    // Déterminer quel joueur s'est déconnecté
    const isPlayer1 = room.players.player1 === client.id;
    const isPlayer2 = room.players.player2 === client.id;

    if (!isPlayer1 && !isPlayer2) {
      // C'est juste un spectateur
      this.playerToRoom.delete(client.id);
      client.leave(gameId);
      this.server.to(gameId).emit('playersUpdate', {
        players: room.players,
        spectatorCount: room.spectators.size,
      });
      return;
    }

    const disconnectedPlayer = isPlayer1 ? 'player1' : 'player2';
    const disconnectedPlayerName = isPlayer1 ? room.playersNames.player1 : room.playersNames.player2;
    const disconnectedUserId = isPlayer1 ? room.playersUserIds.player1 : room.playersUserIds.player2;

    this.logger.log(`⚠️ PLAYER DISCONNECT: ${disconnectedPlayer} (${disconnectedPlayerName}) left game ${gameId}`);

    // Si le jeu est en cours ou en pause, démarrer le timer d'abandon
    if (room.gameState.gameStatus === 'playing' || room.gameState.gameStatus === 'paused') {
      // Mettre en pause si on était en train de jouer
      const wasPlaying = room.gameState.gameStatus === 'playing';
      room.gameState.gameStatus = 'paused';

      // Notifier l'autre joueur de la déconnexion
      this.server.to(gameId).emit('playerDisconnected', {
        disconnectedPlayer,
        playerName: disconnectedPlayerName,
        message: `${disconnectedPlayerName} s'est déconnecté. En attente de reconnexion (10s)...`
      });

      // Initialiser disconnectTimers s'il n'existe pas
      if (!room.disconnectTimers) {
        room.disconnectTimers = {};
      }

      // Annuler le timer précédent s'il existe
      if (room.disconnectTimers[disconnectedPlayer]) {
        clearTimeout(room.disconnectTimers[disconnectedPlayer]);
      }

      // Démarrer un timer de 10 secondes pour l'abandon
      room.disconnectTimers[disconnectedPlayer] = setTimeout(() => {
        this.logger.log(`⏰ DISCONNECT TIMEOUT: ${disconnectedPlayer} did not reconnect to game ${gameId}`);

        // Vérifier que la room existe toujours
        const currentRoom = this.gameRooms.get(gameId);
        if (!currentRoom) return;

        // Vérifier que le joueur n'est toujours pas reconnecté
        const stillDisconnected = isPlayer1 ? !currentRoom.players.player1 : !currentRoom.players.player2;

        if (stillDisconnected && currentRoom.gameState.gameStatus === 'paused') {
          this.logger.log(`🏳️ FORFEIT: ${disconnectedPlayer} abandoned game ${gameId}`);

          // Marquer la partie comme terminée par forfait
          currentRoom.endedByForfeit = true;

          // Donner la victoire à l'autre joueur par abandon
          if (isPlayer1) {
            currentRoom.gameState.score.player2 = 5; // Score gagnant
          } else {
            currentRoom.gameState.score.player1 = 5; // Score gagnant
          }

          // Notifier l'abandon avant de terminer le jeu
          this.server.to(gameId).emit('playerAbandoned', {
            abandonedPlayer: disconnectedPlayer,
            playerName: disconnectedPlayerName,
            winner: isPlayer1 ? 'player2' : 'player1',
            message: `${disconnectedPlayerName} a abandonné la partie !`
          });

          // Terminer le jeu
          this.endGame(gameId);
        }
      }, 10000); // 10 secondes

      this.logger.log(`⏳ DISCONNECT TIMER: Started 10s timer for ${disconnectedPlayer} in game ${gameId}`);
    }

    // Marquer le joueur comme déconnecté
    if (isPlayer1) {
      room.players.player1 = undefined;
      room.gameState.players.player1 = {
        name: `${disconnectedPlayerName} (déconnecté)`,
        id: undefined
      };
    } else {
      room.players.player2 = undefined;
      room.gameState.players.player2 = {
        name: `${disconnectedPlayerName} (déconnecté)`,
        id: undefined
      };
    }

    this.playerToRoom.delete(client.id);
    client.leave(gameId);

    // Notifier les autres clients
    this.server.to(gameId).emit('playersUpdate', {
      players: room.players,
      spectatorCount: room.spectators.size,
    });

    this.server.to(gameId).emit('gameStateUpdate', room.gameState);
  }


}
