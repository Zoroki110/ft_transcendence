import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { User } from './user.entity';
import { Match } from './match.entity';

export enum TournamentStatus {
	DRAFT = 'draft',
	OPEN = 'open',
	FULL = 'full',
	IN_PROGRESS = 'in_progress',
	COMPLETED = 'completed',
	CANCELLED = 'cancelled',
}

export enum TournamentType {
	SINGLE_ELIMINATION = 'single_elimination',
	DOUBLE_ELIMINATION = 'double_elimination',
	ROUND_ROBIN = 'round_robin',
}

@Entity('tournament')
export class Tournament {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ length: 100 })
	name: string;

	@Column({ type: 'text', nullable: true })
	description: string;

	@Column({
		type: 'enum',
		enum: TournamentStatus,
		default: TournamentStatus.DRAFT,
	})
	status: TournamentStatus;

	@Column({
		type: 'enum',
		enum: TournamentType,
		default: TournamentType.SINGLE_ELIMINATION,
	})
	type: TournamentType;

	@Column({ name: 'max_participants', default: 8 })
	maxParticipants: number;

	@Column({ name: 'current_participants', default: 0 })
	currentParticipants: number;

	@Column({ name: 'registration_start', type: 'timestamp', nullable: true })
	registrationStart: Date;

	@Column({ name: 'regitration_end', type: 'timestamp', nullable: true })
	registrationEnd: Date;

	@Column({ name: 'start_date', type: 'timestamp', nullable: true })
	startDate: Date;

	@Column({ name: 'end_date', type: 'timestamp', nullable: true })
	endDate: Date;

	@Column({ name: 'prize_pool', type: 'decimal', precision: 10, scale: 2, nullable: true })
	prizePool: number;

	@Column({ name: 'entry_free', type: 'decimal', precision: 10, scale: 2, default: 0 })
	entryFree: number;

	@Column({ name: 'is_public', default: true })
	isPublic: boolean;

	@Column({ name: 'bracket_generated', default: false })
	bracketGenerated: boolean;

	@ManyToOne(() => User, { eager: true })
	creator: User;

	@Column({ name: 'creator_id' })
	creatorId: number;

	@ManyToMany(() => User, { cascade: true })
	@JoinTable({
		name: 'tournament_participants',
		joinColumn: { name: 'tournaments_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
	})
	participants: User[];

	@OneToMany(() => Match, (match) => match.tournament, { cascade: true })
	matches: Match[];

	@ManyToOne(() => User, { nullable: true })
	winner: User;

	@Column({ name: 'winner_id', nullable: true })
	winnerId: number;

	@CreateDateColumn({ name: 'create_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'update_at' })
	updateAt: Date;

	get isRegistrationOpen(): boolean {
		const now = new Date();
		return (
			(this.status == TournamentStatus.DRAFT || this.status == TournamentStatus.OPEN) &&
			(!this.registrationStart || this.registrationStart <= now) &&
			(!this.registrationEnd || this.registrationEnd >= now) &&
			this.currentParticipants < this.maxParticipants
		);
	}

	get isFull(): boolean {
		// Toujours utiliser la longueur réelle de la liste de participants
		const actualParticipantCount = this.participants?.length || 0;
		return actualParticipantCount >= this.maxParticipants;
	}

	get canStart(): boolean {
		// Toujours utiliser la longueur réelle de la liste de participants
		const actualParticipantCount = this.participants?.length || 0;
		return (
		  actualParticipantCount >= 2 &&
		  (!this.bracketGenerated || this.matches?.length === 0)  // Allow if no actual matches exist
		);
	  }

	// Synchroniser automatiquement currentParticipants avec la longueur réelle
	@BeforeInsert()
	@BeforeUpdate()
	syncParticipantCount() {
		if (this.participants) {
			this.currentParticipants = this.participants.length;
			console.log('🔄 SYNC: currentParticipants updated to', this.currentParticipants);
		}
	}
}
