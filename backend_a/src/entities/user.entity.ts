// backend_a/src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Match } from './match.entity';
import { ChatMessage } from './chat-message.entity';
import { Friendship } from './friendship.entity';

@Entity()
@Unique(['username'])
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 50 })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true, length: 255 })
  avatar?: string;

  @Column({ nullable: true, length: 50 })
  provider: string;

  @Column({ nullable: true, length: 100 })
  providerId: string;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret: string;

  // ===== NOUVEAUX CHAMPS POUR CAHIER DES CHARGES =====

  // Statut en ligne
  @Column({ default: false })
  isOnline: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen: Date;

  // Statistiques de jeu
  @Column({ default: 0 })
  gamesWon: number;

  @Column({ default: 0 })
  gamesLost: number;

  @Column({ default: 0 })
  tournamentsWon: number;

  @Column({ default: 0 })
  totalScore: number;

  // Display name pour les tournois
  @Column({ nullable: true, length: 100 })
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ===== RELATIONS =====

  @OneToMany(() => Match, (match) => match.player1)
  matchesAsPlayer1: Match[];

  @OneToMany(() => Match, (match) => match.player2)
  matchesAsPlayer2: Match[];

  @OneToMany(() => ChatMessage, (message) => message.sender)
  messages: ChatMessage[];

  // Relations d'amitié
  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendRequests: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.addressee)
  receivedFriendRequests: Friendship[];

  // ===== MÉTHODES UTILITAIRES =====

  get winRate(): number {
    const totalGames = this.gamesWon + this.gamesLost;
    return totalGames > 0 ? (this.gamesWon / totalGames) * 100 : 0;
  }

  get totalGames(): number {
    return this.gamesWon + this.gamesLost;
  }
}
