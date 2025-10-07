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
    // Forcer un refresh depuis la DB pour éviter les problèmes de cache
    const user = await this.userRepo.findOne({ 
      where: { id: userId },
      // Forcer le rechargement depuis la base de données
      cache: false
    });
    if (!user) throw new NotFoundException('User not found');

    console.log(`📊 GET STATS: userId=${userId}, gamesWon=${user.gamesWon}, gamesLost=${user.gamesLost} [FRESH FROM DB]`);

    // Utiliser les statistiques directement depuis l'entité User
    const wins = user.gamesWon || 0;
    const losses = user.gamesLost || 0;
    const totalScore = user.totalScore || 0;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    const stats = {
      id: user.id,
      username: user.username,
      gamesWon: wins,
      gamesLost: losses,
      totalGames,
      winRate,
      totalScore,
      tournamentsWon: user.tournamentsWon || 0,
      // Ajouter un timestamp pour éviter le cache côté client
      lastUpdated: new Date().toISOString(),
      // Ajouter un hash pour détecter les changements
      statsHash: this.generateStatsHash(wins, losses, totalScore, user.tournamentsWon || 0)
    };

    console.log(`📈 RETURNING STATS:`, stats);

    return stats;
  }

  // Méthode utilitaire pour générer un hash des stats
  private generateStatsHash(wins: number, losses: number, totalScore: number, tournamentsWon: number): string {
    const data = `${wins}-${losses}-${totalScore}-${tournamentsWon}`;
    return Buffer.from(data).toString('base64');
  }

  // Méthode pour incrémenter les victoires/défaites directement
  async updateGameStats(winnerId: number, loserId: number): Promise<void> {
    console.log(`📊 USERS SERVICE: Mise à jour stats - winnerId=${winnerId}, loserId=${loserId}`);

    try {
      // Vérifier les valeurs AVANT mise à jour
      const winnerBefore = await this.userRepo.findOne({ where: { id: winnerId }, cache: false });
      const loserBefore = await this.userRepo.findOne({ where: { id: loserId }, cache: false });

      console.log(`📊 BEFORE UPDATE - WINNER ${winnerId} (${winnerBefore?.username}): gamesWon=${winnerBefore?.gamesWon}, gamesLost=${winnerBefore?.gamesLost}`);
      console.log(`📊 BEFORE UPDATE - LOSER ${loserId} (${loserBefore?.username}): gamesWon=${loserBefore?.gamesWon}, gamesLost=${loserBefore?.gamesLost}`);

      await Promise.all([
        // Incrémenter les victoires du gagnant
        this.userRepo.increment({ id: winnerId }, 'gamesWon', 1),
        // Incrémenter les défaites du perdant
        this.userRepo.increment({ id: loserId }, 'gamesLost', 1),
      ]);

      console.log(`✅ USERS SERVICE: Stats mises à jour avec succès`);

      // Vérifier les nouvelles valeurs APRÈS mise à jour (avec un délai pour s'assurer que la DB est à jour)
      await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai de 100ms
      
      const winnerAfter = await this.userRepo.findOne({ where: { id: winnerId }, cache: false });
      const loserAfter = await this.userRepo.findOne({ where: { id: loserId }, cache: false });

      console.log(`📈 AFTER UPDATE - WINNER ${winnerId} (${winnerAfter?.username}): gamesWon=${winnerAfter?.gamesWon}, gamesLost=${winnerAfter?.gamesLost}`);
      console.log(`📉 AFTER UPDATE - LOSER ${loserId} (${loserAfter?.username}): gamesWon=${loserAfter?.gamesWon}, gamesLost=${loserAfter?.gamesLost}`);

    } catch (error) {
      console.error(`❌ USERS SERVICE: Erreur mise à jour stats:`, error);
      throw error;
    }
  }

  // Méthode pour rafraîchir les stats en forçant un reload de la DB
  async refreshUserStats(userId: number) {
    console.log(`🔄 REFRESH STATS: Forçage du rafraîchissement pour userId=${userId}`);
    
    // Forcer un reload en récupérant à nouveau les données
    const freshUser = await this.userRepo.findOne({ 
      where: { id: userId }, 
      cache: false 
    });
    
    if (!freshUser) throw new NotFoundException('User not found');
    
    console.log(`🔄 FRESH DATA: userId=${userId}, gamesWon=${freshUser.gamesWon}, gamesLost=${freshUser.gamesLost}`);
    
    return this.getUserStats(userId);
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

  // ===============================
  // NOUVELLES MÉTHODES - RECHERCHE D'UTILISATEURS
  // ===============================

  async searchUsers(searchQuery: string, currentUserId?: number): Promise<SafeUser[]> {
    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.avatar',
        'user.displayName',
        'user.isOnline',
        'user.gamesWon',
        'user.gamesLost',
      ])
      .where('LOWER(user.username) LIKE LOWER(:search)', {
        search: `%${searchQuery}%`,
      })
      .orWhere('LOWER(user.displayName) LIKE LOWER(:search)', {
        search: `%${searchQuery}%`,
      });

    // Exclure l'utilisateur actuel des résultats
    if (currentUserId) {
      queryBuilder.andWhere('user.id != :currentUserId', { currentUserId });
    }

    const users = await queryBuilder.orderBy('user.username', 'ASC').take(20).getMany();

    return users.map((user) => toSafe(user)!);
  }
}
