import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.matchesAsPlayer1)
  player1: User;

  @ManyToOne(() => User, user => user.matchesAsPlayer2)
  player2: User;

  @Column()
  score1: number;

  @Column()
  score2: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  playedAt: Date;
}
