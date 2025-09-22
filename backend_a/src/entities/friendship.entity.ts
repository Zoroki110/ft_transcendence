import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
  } from 'typeorm';
  import { User } from './user.entity';
  
  export enum FriendshipStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    BLOCKED = 'blocked',
  }
  
  @Entity('friendships')
  @Unique(['requesterId', 'addresseeId'])
  export class Friendship {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    requesterId: number;
  
    @ManyToOne(() => User, { eager: true })
    requester: User;
  
    @Column()
    addresseeId: number;
  
    @ManyToOne(() => User, { eager: true })
    addressee: User;
  
    @Column({
      type: 'enum',
      enum: FriendshipStatus,
      default: FriendshipStatus.PENDING,
    })
    status: FriendshipStatus;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }