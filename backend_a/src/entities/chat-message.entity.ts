import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum MessageType {
  GLOBAL = 'global',
  PRIVATE = 'private',
}

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column()
  senderId: number;

  @ManyToOne(() => User, (user) => user.messages, { eager: true })
  sender: User;

  @Column({ nullable: true })
  recipientId: number;

  @ManyToOne(() => User, { eager: true, nullable: true })
  recipient: User;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.GLOBAL,
  })
  type: MessageType;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  sentAt: Date;
}
