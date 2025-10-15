import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tournament } from './tournament.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.matchesAsPlayer1, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player1_id' })
  player1: User | null;

  @ManyToOne(() => User, (user) => user.matchesAsPlayer2, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player2_id' })
  player2: User | null;

  @Column({ default: 0, type: 'int' })
  player1Score: number;

  @Column({ default: 0, type: 'int' })
  player2Score: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'finished', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;

  @ManyToOne(() => Tournament, (tournament) => tournament.matches, {
    nullable: true,
  })
  @JoinColumn({ name: 'tournament_id' })
  tournament: Tournament;

  @Column({ name: 'tournament_id', nullable: true })
  tournamentId: number;

  @Column({ name: 'round', nullable: true })
  round: number; // Pour savoir à quel tour du tournoi appartient ce match

  @Column({ name: 'bracket_position', nullable: true })
  bracketPosition: number; // Position dans l'arbre d'élimination

  @Column({ name: 'game_id', nullable: true })
  gameId: string; // ID de jeu compatible avec le système existant
}
