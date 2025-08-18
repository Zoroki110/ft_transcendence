import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from 'typeorm';
import { Match } from './match.entity';
import { ChatMessage } from './chat-message.entity';

@Entity()
@Unique(['username'])
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => Match, match => match.player1)
  matchesAsPlayer1: Match[];

  @OneToMany(() => Match, match => match.player2)
  matchesAsPlayer2: Match[];

  @OneToMany(() => ChatMessage, message => message.sender)
  messages: ChatMessage[];
}
