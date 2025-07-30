import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  mode: string; // exemple : '1v1', 'tournament', etc.

  @Column({ default: true })
  isActive: boolean;
}
