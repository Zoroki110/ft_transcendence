import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTournamentDto } from './create-tournament.dto';
import { TournamentStatus } from '../../entities/tournament.entity';
import { APP_FILTER } from '@nestjs/core';

export class UpdateTournamentDto extends PartialType(CreateTournamentDto) {
	@ApiPropertyOptional({
		description: 'Status du Tournoi',
		enum: TournamentStatus,
		example: TournamentStatus.OPEN
	})
	@IsOptional()
	@IsEnum(TournamentStatus, { message: 'Status du Tournoi invalide' })
	status?: TournamentStatus;

	@ApiPropertyOptional({
		description: 'Nombre actuel de participants (lecture seule en général)',
		example: 4,
		minimum: 0
	})
	@IsOptional()
	@IsNumber({}, { message: 'Le nombre de participants doit être un nombre' })
	@Min(0, { message: 'Le nombre de participants ne peut pas être négatif' })
	@Transform(({ value }) => parseInt(value))
	currentParticipants?: number;

	@ApiPropertyOptional({
		description: 'Date de fin du tournoi',
		example: '2025-09-01T18:00:00Z',
	})
	@IsOptional()
	endDate?: string;

	@ApiPropertyOptional({
		description: 'ID du gagnant du tournoi',
		example: 123
	})
	@IsOptional()
	@IsNumber({}, { message: 'L\'ID du gagnant doit être un nombre' })
	@Transform(({ value }) => parseInt(value))
	winnerId?: number;

	@ApiPropertyOptional({
		description: 'Bracket genere ou non',
		example: true
	})
	@IsOptional()
	bracketGenereted?: boolean;
}