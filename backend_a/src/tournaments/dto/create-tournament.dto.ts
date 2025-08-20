import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsPositive,
  isString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentType } from '../../entities/tournament.entity';

export class CreateTournamentDto {
	@ApiProperty({
		description: 'Nom du tournoi',
		example: 'Tournoi de Pong 2025',
		minLength: 3,
		maxLength: 100
	})
	@IsString()
	@MinLength(3, { message: 'Le nom doit faire au moins 3 caractères' })
	@MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
	name: string;

	@ApiPropertyOptional({
		description: 'Description du tournoi',
		example: 'Un tournoi épique de Pong avec des prix incroyables !'
	})
	@IsOptional()
	@IsString()
	@MaxLength(1000, { message: 'La description ne peut pas dépasser 1000 caractères' })
	description?: string;

	@ApiPropertyOptional({
		description: 'Type de tournoi',
		enum: TournamentType,
		default: TournamentType.SINGLE_ELIMINATION
	})
	@IsOptional()
	@IsEnum(TournamentType, { message: 'Type de tournoi invalide' })
	type?: TournamentType;

	@ApiPropertyOptional({
		description: 'Nombre maximum de participants',
		example: 16,
		minimum: 2,
		maximum: 64,
		default: 8
	})
	@IsOptional()
	@IsNumber({}, { message: 'Le nombre de participants doit être un nombre' })
	@Min(2, { message: 'Au minimum 2 participants' })
	@Max(64, { message: 'Au maximum 64 participants' })
	@Transform(({ value }) => parseInt(value))
	maxParticipants?: number;

	@ApiPropertyOptional({
		description: 'Date de début des inscriptions',
		example: '2025-08-25T10:00:00Z'
	})
	@IsOptional()
	@IsDateString({}, { message: 'Date de début des inscriptions invalide' })
	registrationStart?: string;

	@ApiPropertyOptional({
		description: 'Date de fin des inscriptions',
		example: '2025-08-30T23:59:59Z'
	})
	@IsOptional()
	@IsDateString({}, { message: 'Date de fin des inscriptions invalide' })
	registrationEnd?: string;

	@ApiPropertyOptional({
		description: 'Date de début du tournoi',
		example: '2025-09-01T14:00:00Z'
	})
	@IsOptional()
	@IsDateString({}, { message: 'Date de début du tournoi invalide' })
	startDate?: string;

	@ApiPropertyOptional({
		description: 'Prize pool du tournoi (en euros)',
		example: 100.50,
		minimum: 0
	})
	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 }, { message: 'Le prize pool doit être un nombre avec maximum 2 décimales' })
	@Min(0, { message: 'Le prize pool ne peut pas être négatif' })
	@Transform(({ value }) => parseFloat(value))
	prizePool?: number;

	@ApiPropertyOptional({
		description: 'Frais d\'inscription (en euros)',
		example: 5.00,
		minimum: 0,
		default: 0
	})
	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 }, { message: 'Les frais d\'inscription doivent être un nombre avec maximum 2 décimales' })
	@Min(0, { message: 'Les frais d\'inscription ne peuvent pas être négatifs' })
	@Transform(({ value }) => parseFloat(value))
	entryFee?: number;

	@ApiPropertyOptional({
		description: 'Tournoi public ou privé',
		example: true,
		default: true
	})
	@IsOptional()
	@IsBoolean({ message: 'isPublic doit être un booléen' })
	@Transform(({ value }) => value == 'true' || value == true)
	isPublic?: boolean;
}