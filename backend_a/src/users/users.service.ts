// backend_a/src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

import { User } from '../entities/user.entity';
import { Friendship, FriendshipStatus } from '../entities/friendship.entity';
import { Match } from '../entities/match.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type SafeUser = Omit<User, 'password' | 'twoFactorSecret'>;

function toSafe(u: User | null | undefined): SafeUser | null {
  if (!u) return null;
  const { password, twoFactorSecret, ...safe } = u;
  return safe as SafeUser;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendshipRepo: Repository<Friendship>,
    @InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
  ) {}

  // ===============================
  // MÉTHODES EXISTANTES (gardées)
  // ===============================

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userRepo.find({
      select: ['id', 'username', 'email', 'avatar', 'isOnline', 'displayName'],
    });
    return users as SafeUser[];
  }

  async findOne(id: number): Promise<SafeUser | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    return toSafe(user);
  }

  async findOrCreate(userData: {
    username: string;
    email: string;
  }): Promise<SafeUser> {
    let user = await this.userRepo.findOne({
      where: { email: userData.email },
    });
    if (!user) {
      const exists = await this.userRepo.findOne({
        where: [{ username: userData.username }, { email: userData.email }],
        select: ['id'],
      });
      if (exists)
        throw new ConflictException('Username or email already exists');

      user = this.userRepo.create({
        username: userData.username,
        email: userData.email,
        password: '',
      });
      user = await this.userRepo.save(user);
    }
    return toSafe(user)!;
  }

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const exists = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
      select: ['id'],
    });
    if (exists) throw new ConflictException('Username or email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      password: passwordHash,
      displayName: dto.username, // Par défaut, displayName = username
    });
    const saved = await this.userRepo.save(user);
    return toSafe(saved)!;
  }

  async update(id: number, dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (dto.username) {
      const conflictU = await this.userRepo.findOne({
        where: { username: dto.username, id: Not(id) as any },
        select: ['id'],
      });
      if (conflictU) throw new ConflictException('Username already exists');
    }
    if (dto.email) {
      const conflictE = await this.userRepo.findOne({
        where: { email: dto.email, id: Not(id) as any },
        select: ['id'],
      });
      if (conflictE) throw new ConflictException('Email already exists');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 12);
    }

    await this.userRepo.update(id, {
      ...dto,
      ...(passwordHash ? { password: passwordHash } : {}),
    });

    const updated = await this.userRepo.findOne({ where: { id } });
    if (!updated)
      throw new NotFoundException(`User ${id} not found after update`);
    return toSafe(updated)!;
  }

  async remove(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  async findOneRawByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } }); // avec password
  }

  // ===============================
  // NOUVELLES MÉTHODES - FRIENDS
  // ===============================

  async sendFriendRequest(
    requesterId: number,
    addresseeId: number,
  ): Promise<Friendship> {
    // Vérifier que les deux users existent
    const [requester, addressee] = await Promise.all([
      this.userRepo.findOne({ where: { id: requesterId } }),
      this.userRepo.findOne({ where: { id: addresseeId } }),
    ]);

    if (!requester) throw new NotFoundException('Requester not found');
    if (!addressee) throw new NotFoundException('Addressee not found');
    if (requesterId === addresseeId)
      throw new BadRequestException('Cannot add yourself as friend');

    // Vérifier qu'il n'y a pas déjà une relation
    const existing = await this.friendshipRepo.findOne({
      where: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    });

    if (existing) {
      throw new ConflictException('Friendship already exists or pending');
    }

    const friendship = this.friendshipRepo.create({
      requesterId,
      addresseeId,
      requester,
      addressee,
      status: FriendshipStatus.PENDING,
    });

    return await this.friendshipRepo.save(friendship);
  }

  async acceptFriendRequest(
    friendshipId: number,
    userId: number,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepo.findOne({
      where: { id: friendshipId },
      relations: ['requester', 'addressee'],
    });

    if (!friendship) throw new NotFoundException('Friend request not found');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('You can only accept requests sent to you');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Friend request is not pending');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    return await this.friendshipRepo.save(friendship);
  }

  async rejectFriendRequest(
    friendshipId: number,
    userId: number,
  ): Promise<void> {
    const friendship = await this.friendshipRepo.findOne({
      where: { id: friendshipId },
    });

    if (!friendship) throw new NotFoundException('Friend request not found');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('You can only reject requests sent to you');
    }

    await this.friendshipRepo.delete(friendshipId);
  }

  async removeFriend(userId: number, friendId: number): Promise<void> {
    const friendship = await this.friendshipRepo.findOne({
      where: [
        {
          requesterId: userId,
          addresseeId: friendId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requesterId: friendId,
          addresseeId: userId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    if (!friendship) throw new NotFoundException('Friendship not found');
    await this.friendshipRepo.delete(friendship.id);
  }

  async getFriends(userId: number): Promise<SafeUser[]> {
    const friendships = await this.friendshipRepo.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    const friends = friendships.map((friendship) => {
      return friendship.requesterId === userId
        ? friendship.addressee
        : friendship.requester;
    });

    return friends.map((friend) => toSafe(friend)!);
  }

  async getPendingFriendRequests(userId: number): Promise<Friendship[]> {
    return await this.friendshipRepo.find({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
      relations: ['requester', 'addressee'],
    });
  }

  // ===============================
  // NOUVELLES MÉTHODES - AVATAR
  // ===============================

  async updateAvatar(userId: number, filename: string): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Supprimer l'ancien avatar s'il existe
    if (user.avatar) {
      const oldAvatarPath = path.join(
        './uploads/avatars',
        path.basename(user.avatar),
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Mettre à jour avec le nouveau avatar
    user.avatar = `/uploads/avatars/${filename}`;
    const updated = await this.userRepo.save(user);
    return toSafe(updated)!;
  }

  async removeAvatar(userId: number): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.avatar) {
      const avatarPath = path.join(
        './uploads/avatars',
        path.basename(user.avatar),
      );
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    user.avatar = undefined; // Changé de null à undefined
    const updated = await this.userRepo.save(user);
    return toSafe(updated)!;
  }

  // ===============================
  // NOUVELLES MÉTHODES - MATCH HISTORY
  // ===============================

  async getMatchHistory(userId: number): Promise<Match[]> {
    return await this.matchRepo.find({
      where: [{ player1: { id: userId } }, { player2: { id: userId } }],
      relations: ['player1', 'player2', 'tournament'],
      order: { createdAt: 'DESC' },
      take: 50, // Limiter à 50 derniers matches
    });
  }

  // ===============================
  // NOUVELLES MÉTHODES - STATS
  // ===============================

  async getUserStats(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Calculer les stats en temps réel depuis les matches
    const matches = await this.matchRepo.find({
      where: [{ player1: { id: userId } }, { player2: { id: userId } }],
      relations: ['player1', 'player2'],
    });

    let wins = 0;
    let losses = 0;
    let totalScore = 0;

    matches.forEach((match) => {
      // Déterminer le gagnant basé sur les scores
      if (match.status === 'finished') {
        const isPlayer1 = match.player1.id === userId;
        const userScore = isPlayer1 ? match.player1Score : match.player2Score;
        const opponentScore = isPlayer1
          ? match.player2Score
          : match.player1Score;

        if (userScore > opponentScore) {
          wins++;
        } else if (opponentScore > userScore) {
          losses++;
        }
        // Si égalité, on ne compte ni win ni loss
      }

      // Additionner le score du joueur
      if (match.player1.id === userId) {
        totalScore += match.player1Score || 0;
      } else {
        totalScore += match.player2Score || 0;
      }
    });

    // Mettre à jour les stats en base
    await this.userRepo.update(userId, {
      gamesWon: wins,
      gamesLost: losses,
      totalScore,
    });

    return {
      id: user.id,
      username: user.username,
      gamesWon: wins,
      gamesLost: losses,
      totalGames: wins + losses,
      winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
      totalScore,
      tournamentsWon: user.tournamentsWon,
    };
  }

  // ===============================
  // NOUVELLES MÉTHODES - ONLINE STATUS
  // ===============================

  async setOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    const updateData: Partial<User> = {
      isOnline,
      lastSeen: new Date(),
    };

    await this.userRepo.update(userId, updateData);
  }

  async getOnlineFriends(userId: number): Promise<SafeUser[]> {
    const friends = await this.getFriends(userId);
    return friends.filter((friend) => friend.isOnline);
  }

  // ===============================
  // MÉTHODES UTILITAIRES
  // ===============================

  async updateDisplayName(
    userId: number,
    displayName: string,
  ): Promise<SafeUser> {
    // Vérifier que le displayName n'est pas déjà pris
    const existing = await this.userRepo.findOne({
      where: { displayName, id: Not(userId) as any },
    });

    if (existing) {
      throw new ConflictException('Display name already taken');
    }

    await this.userRepo.update(userId, { displayName });
    const updated = await this.userRepo.findOne({ where: { id: userId } });
    return toSafe(updated)!;
  }
}
