import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge, ChallengeStatus } from '../entities/challenge.entity';
import { User } from '../entities/user.entity';
import { CreateChallengeDto } from './dto/create-challenge.dto';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepo: Repository<Challenge>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createChallenge(
    challengerId: number,
    dto: CreateChallengeDto,
  ): Promise<Challenge> {
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

    return await this.challengeRepo.save(challenge);
  }

  async acceptChallenge(challengeId: number, userId: number): Promise<Challenge> {
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
    return await this.challengeRepo.save(challenge);
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
