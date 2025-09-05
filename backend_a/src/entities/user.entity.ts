import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  Unique,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Match } from './match.entity';
import { ChatMessage } from './chat-message.entity';

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

  @Column({ nullable: true, length: 255})
  avatar: string;

  @Column({ nullable: true, length: 50})
  provider: string;

  @Column({ nullable: true, length: 100})
  providerId: string;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret: string;

  @CreateDateColumn()
  createdAt: Date;

  @CreateDateColumn()
  updateAt: Date;

  @OneToMany(() => Match, match => match.player1)
  matchesAsPlayer1: Match[];

  @OneToMany(() => Match, match => match.player2)
  matchesAsPlayer2: Match[];

  @OneToMany(() => ChatMessage, message => message.sender)
  messages: ChatMessage[];
}
