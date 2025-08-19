import { 
  Entity, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  Column, 
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.matchesAsPlayer1, {
  nullable: false,
  onDelete: 'CASCADE'})
  @JoinColumn({ name: 'player1_id' })
  player1: User;

  @ManyToOne(() => User, user => user.matchesAsPlayer2, {
    nullable: false,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'player2_id' })
  player2: User;

  @Column({ default: 0, type: 'int' })
  player1Score: number;

  @Column({ default: 0, type: 'int' })
  player2Score: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'finished', 'cancelled'],
    default: 'pending'
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date;
}