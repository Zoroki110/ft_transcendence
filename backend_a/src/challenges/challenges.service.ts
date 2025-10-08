import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge, ChallengeStatus } from '../entities/challenge.entity';
import { User } from '../entities/user.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { GameService } from '../game/game.service';
import { GameGateway } from '../game/game.gateway';

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger('ChallengesService');

  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gameService: GameService,
    @Inject(forwardRef(() => GameGateway))
    private readonly gameGateway: GameGateway,
  ) {}

  async createChallenge(
    challengerId: number,
    dto: CreateChallengeDto,
  ): Promise<Challenge & { gameId?: string }> {
    // Vérifier que les deux utilisateurs existent
    const [challenger, challenged] = await Promise.all([
      this.userRepo.findOne({ where: { id: challengerId } }),
      this.userRepo.findOne({ where: { id: dto.challengedId } }),
    ]);

    if (!challenger) throw new NotFoundException('Challenger not found');
    if (!challenged) throw new NotFoundException('Challenged user not found');

    if (challengerId === dto.challengedId) {
      throw new BadRequestException('Cannot challenge yourself');
    }

    // Vérifier qu'il n'y a pas déjà un défi en cours entre ces deux utilisateurs
    const existingChallenge = await this.challengeRepo.findOne({
      where: [
        { challengerId, challengedId: dto.challengedId, status: ChallengeStatus.PENDING },
        { challengerId: dto.challengedId, challengedId: challengerId, status: ChallengeStatus.PENDING },
      ],
    });

    if (existingChallenge) {
      throw new BadRequestException('A challenge is already pending between these users');
    }

    const challenge = this.challengeRepo.create({
      challengerId,
      challengedId: dto.challengedId,
      challenger,
      challenged,
      message: dto.message,
      status: ChallengeStatus.PENDING,
    });

    let savedChallenge = await this.challengeRepo.save(challenge);

    // Créer immédiatement la room de jeu en attente
    const gameId = `challenge_${savedChallenge.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`🎮 Défi créé #${savedChallenge.id}: ${challenger.username} défie ${challenged.username}`);
    this.logger.log(`🎮 Room créée en attente: ${gameId}`);

    // Créer la room avec les joueurs pré-assignés
    this.gameService.createChallengeRoom(
      gameId,
      challengerId,
      dto.challengedId,
      challenger.username,
      challenged.username,
    );

    // Sauvegarder le gameId dans le challenge
    savedChallenge.gameId = gameId;
    savedChallenge = await this.challengeRepo.save(savedChallenge);

    // Retourner le challenge avec le gameId pour que le frontend redirige le challenger
    return {
      ...savedChallenge,
      gameId,
    };
  }

  async acceptChallenge(challengeId: number, userId: number): Promise<Challenge & { gameId?: string }> {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
      relations: ['challenger', 'challenged'],
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    if (challenge.challengedId !== userId) {
      throw new ForbiddenException('You can only accept challenges sent to you');
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestException('Challenge is not pending');
    }

    challenge.status = ChallengeStatus.ACCEPTED;
    const savedChallenge = await this.challengeRepo.save(challenge);

    // Récupérer le gameId existant (créé lors de l'envoi du défi)
    const gameId = challenge.gameId;

    if (!gameId) {
      this.logger.error(`❌ No gameId found for challenge ${challengeId}`);
      throw new BadRequestException('Challenge game room not found');
    }

    this.logger.log(`🎮 Défi accepté #${challengeId}: ${challenge.challenger.username} vs ${challenge.challenged.username}`);
    this.logger.log(`🎮 Utilisation du gameId existant: ${gameId}`);

    // Notifier le challenger via WebSocket qu'il peut rejoindre (il attend déjà dans la room)
    this.gameGateway.notifyChallengeAccepted(
      challenge.challengerId,
      gameId,
      challenge.challenged.username,
    );
    this.logger.log(`🔔 Notification envoyée au challenger (ID: ${challenge.challengerId})`);

    // Retourner le challenge avec le gameId pour que le frontend puisse rediriger
    return {
      ...savedChallenge,
      gameId,
    };
  }

  async declineChallenge(challengeId: number, userId: number): Promise<void> {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    if (challenge.challengedId !== userId) {
      throw new ForbiddenException('You can only decline challenges sent to you');
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestException('Challenge is not pending');
    }

    challenge.status = ChallengeStatus.DECLINED;
    await this.challengeRepo.save(challenge);
  }

  async cancelChallenge(challengeId: number, userId: number): Promise<void> {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    if (challenge.challengerId !== userId) {
      throw new ForbiddenException('You can only cancel challenges you sent');
    }

    if (challenge.status !== ChallengeStatus.PENDING) {
      throw new BadRequestException('Challenge is not pending');
    }

    challenge.status = ChallengeStatus.CANCELLED;
    await this.challengeRepo.save(challenge);
  }

  async getPendingChallenges(userId: number): Promise<Challenge[]> {
    return await this.challengeRepo.find({
      where: { challengedId: userId, status: ChallengeStatus.PENDING },
      relations: ['challenger', 'challenged'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSentChallenges(userId: number): Promise<Challenge[]> {
    return await this.challengeRepo.find({
      where: { challengerId: userId, status: ChallengeStatus.PENDING },
      relations: ['challenger', 'challenged'],
      order: { createdAt: 'DESC' },
    });
  }

  async getChallengeHistory(userId: number): Promise<Challenge[]> {
    return await this.challengeRepo.find({
      where: [
        { challengerId: userId },
        { challengedId: userId },
      ],
      relations: ['challenger', 'challenged'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markChallengeAsCompleted(challengeId: number, matchId: number): Promise<void> {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) throw new NotFoundException('Challenge not found');

    challenge.status = ChallengeStatus.COMPLETED;
    challenge.matchId = matchId;
    await this.challengeRepo.save(challenge);
  }
}
