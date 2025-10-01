import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { FinishMatchDto } from './dto/finish-match.dto';

@Injectable()
export class GameService {
  private readonly logger = new Logger('GameService');

  constructor(
    @InjectRepository(Match)
    private matchRepo: Repository<Match>,
  ) {}

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
}
