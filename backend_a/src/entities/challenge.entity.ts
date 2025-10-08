import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ChallengeStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  challengerId: number;

  @ManyToOne(() => User, { eager: true })
  challenger: User;

  @Column()
  challengedId: number;

  @ManyToOne(() => User, { eager: true })
  challenged: User;

  @Column({
    type: 'enum',
    enum: ChallengeStatus,
    default: ChallengeStatus.PENDING,
  })
  status: ChallengeStatus;

  @Column({ nullable: true })
  matchId: number; // ID du match créé après acceptation

  @Column({ type: 'text', nullable: true })
  gameId: string; // ID de la room de jeu créée

  @Column({ type: 'text', nullable: true })
  message: string; // Message optionnel avec le défi

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
