import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { FinishMatchDto } from './dto/finish-match.dto';

@Injectable()
export class GameService {
  private readonly logger = new Logger('GameService');
  private gameGateway: any; // Injection manuelle via setter

  constructor(
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
  ) {}

  // Setter pour éviter la dépendance circulaire
  setGameGateway(gameGateway: any) {
    this.gameGateway = gameGateway;
  }

  async createMatch(createMatchDto: CreateMatchDto) {
    const match = this.matchRepo.create({
      player1: { id: createMatchDto.player1Id },
      player2: { id: createMatchDto.player2Id },
      status: 'pending',
    });
    return this.matchRepo.save(match);
  }

  async findAllMatches(status?: string) {
    const where = status ? { status } : {};
    return this.matchRepo.find({
      where,
      relations: ['player1', 'player2'],
      select: {
        player1: { id: true, username: true },
        player2: { id: true, username: true },
      },
    });
  }

  async findOneMatch(id: number) {
    const match = await this.matchRepo.findOne({
      where: { id },
      relations: ['player1', 'player2'],
      select: {
        player1: { id: true, username: true, avatar: true },
        player2: { id: true, username: true, avatar: true },
      },
    });
    if (!match) {
      throw new NotFoundException(`Match ${id} not found`);
    }
    return match;
  }

  async finishMatch(id: number, finishMatchDto: FinishMatchDto) {
    const match = await this.findOneMatch(id);

    Object.assign(match, {
      player1Score: finishMatchDto.player1Score,
      player2Score: finishMatchDto.player2Score,
      status: 'finished',
      finishedAt: new Date(),
    });

    return this.matchRepo.save(match);
  }

  async createQuickMatch() {
    // Générer un ID de match unique pour le jeu en temps réel
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      gameId,
      message: 'Quick match créé ! Partagez cet ID avec votre adversaire.',
      gameUrl: `/game/${gameId}`,
    };
  }

  // File d'attente globale pour le matchmaking
  private static waitingGameId: string | null = null;
  
  // Liste des lobbys en attente
  private static waitingLobbys: Map<string, {
    id: string;
    hostId: number;
    hostUsername: string;
    hostAvatar?: string;
    createdAt: Date;
    status: 'waiting' | 'full';
    playersCount: number;
    maxPlayers: number;
  }> = new Map();

  async createQuickMatchWithWaiting() {
    const currentTime = new Date().toISOString();

    this.logger.log(`🎮 [${currentTime}] MATCHMAKING: Nouvelle demande de partie rapide`);
    this.logger.log(`🎮 [${currentTime}] MATCHMAKING: État actuel waitingGameId = ${GameService.waitingGameId}`);

    // Si quelqu'un attend déjà, rejoindre sa partie
    if (GameService.waitingGameId) {
      const gameId = GameService.waitingGameId;
      this.logger.log(`🎮 [${currentTime}] MATCHMAKING: Adversaire trouvé ! Rejoindre la partie ${gameId}`);
      GameService.waitingGameId = null; // Retirer de l'attente car la partie va commencer
      this.logger.log(`🎮 [${currentTime}] MATCHMAKING: waitingGameId mis à null`);

      const result = {
        gameId,
        message: 'Adversaire trouvé ! Rejoignez la partie.',
        gameUrl: `/game/${gameId}`,
        isWaiting: false,
      };

      this.logger.log(`🎮 [${currentTime}] MATCHMAKING: Retour joueur 2 ->`, result);
      return result;
    } else {
      // Créer une nouvelle partie et attendre
      const gameId = `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.logger.log(`🎮 [${currentTime}] MATCHMAKING: Aucun joueur en attente, création d'une nouvelle partie ${gameId}`);
      GameService.waitingGameId = gameId; // Mettre en attente
      this.logger.log(`🎮 [${currentTime}] MATCHMAKING: waitingGameId mis à ${GameService.waitingGameId}`);

      const result = {
        gameId,
        message: 'En attente d\'un adversaire...',
        gameUrl: `/game/${gameId}`,
        isWaiting: true,
      };

      this.logger.log(`🎮 [${currentTime}] MATCHMAKING: Retour joueur 1 ->`, result);
      return result;
    }
  }

  getWaitingRoomsCount(): number {
    return GameService.waitingGameId ? 1 : 0;
  }

  // Nouvelles méthodes pour gérer les lobbys
  createLobby(hostId: number, hostUsername: string, hostAvatar?: string) {
    const gameId = `lobby_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const lobby = {
      id: gameId,
      hostId,
      hostUsername,
      hostAvatar,
      createdAt: new Date(),
      status: 'waiting' as const,
      playersCount: 1,
      maxPlayers: 2,
    };

    GameService.waitingLobbys.set(gameId, lobby);
    
    this.logger.log(`🏓 Lobby créé: ${gameId} par ${hostUsername}`);
    
    return {
      gameId,
      message: 'Lobby créé ! En attente d\'un adversaire.',
      gameUrl: `/lobby/${gameId}`,
      isWaiting: true,
    };
  }

  getAllWaitingLobbys() {
    this.logger.log(`📋 Nombre total de lobbys en Map: ${GameService.waitingLobbys.size}`);
    
    const allLobbys = Array.from(GameService.waitingLobbys.values());
    this.logger.log(`📋 Lobbys bruts:`, JSON.stringify(allLobbys, null, 2));
    
    const lobbys = allLobbys
      .filter(lobby => lobby.status === 'waiting')
      .map(lobby => {
        if (!lobby.hostId) {
          this.logger.error(`❌ Lobby ${lobby.id} a un hostId undefined:`, JSON.stringify(lobby, null, 2));
          return null;
        }
        return {
          id: lobby.id,
          host: {
            id: lobby.hostId.toString(),
            username: lobby.hostUsername,
            avatar: lobby.hostAvatar,
          },
          status: lobby.status,
          createdAt: lobby.createdAt.toISOString(),
          playersCount: lobby.playersCount,
          maxPlayers: lobby.maxPlayers,
        };
      })
      .filter(lobby => lobby !== null);

    this.logger.log(`📋 Récupération de ${lobbys.length} lobbys en attente valides`);
    return lobbys;
  }

  joinLobby(lobbyId: string, playerId: number, playerUsername: string) {
    const lobby = GameService.waitingLobbys.get(lobbyId);
    
    if (!lobby) {
      throw new Error('Lobby introuvable');
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Ce lobby n\'est plus disponible');
    }

    if (lobby.playersCount >= lobby.maxPlayers) {
      throw new Error('Lobby complet');
    }

    // Marquer le lobby comme complet
    lobby.status = 'full';
    lobby.playersCount = 2;
    GameService.waitingLobbys.set(lobbyId, lobby);

    this.logger.log(`🎯 ${playerUsername} rejoint le lobby ${lobbyId}`);

    // Notifier via WebSocket que le lobby est maintenant complet
    const gameUrl = `/game/${lobbyId}`;
    if (this.gameGateway && this.gameGateway.notifyLobbyComplete) {
      this.gameGateway.notifyLobbyComplete(lobbyId, gameUrl);
      this.logger.log(`🔔 WebSocket notification sent for lobby ${lobbyId}`);
    }

    return {
      gameId: lobbyId,
      message: 'Lobby rejoint ! La partie va commencer.',
      gameUrl,
      isWaiting: false,
    };
  }

  removeLobby(lobbyId: string) {
    const deleted = GameService.waitingLobbys.delete(lobbyId);
    if (deleted) {
      this.logger.log(`🗑️ Lobby supprimé: ${lobbyId}`);
    }
    return deleted;
  }
}
