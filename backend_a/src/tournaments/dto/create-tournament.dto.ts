import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TournamentType } from '../../entities/tournament.entity';

export class CreateTournamentDto {
  @ApiProperty({
    description: 'Nom du tournoi',
    example: 'Tournoi de Pong 2025',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3, { message: 'Le nom doit faire au moins 3 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description du tournoi',
    example: 'Un tournoi épique de Pong avec des prix incroyables !',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'La description ne peut pas dépasser 1000 caractères',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Type de tournoi',
    enum: TournamentType,
    default: TournamentType.SINGLE_ELIMINATION,
  })
  @IsOptional()
  @IsEnum(TournamentType, { message: 'Type de tournoi invalide' })
  type?: TournamentType;

  @ApiPropertyOptional({
    description: 'Nombre maximum de participants (4 ou 8)',
    example: 8,
    enum: [4, 8],
    default: 8,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le nombre de participants doit être un nombre' })
  @Transform(({ value }) => parseInt(value))
  maxParticipants?: number;


  @ApiPropertyOptional({
    description: 'Prize pool du tournoi (en euros)',
    example: 100.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Le prize pool doit être un nombre avec maximum 2 décimales' },
  )
  @Min(0, { message: 'Le prize pool ne peut pas être négatif' })
  @Transform(({ value }) => parseFloat(value))
  prizePool?: number;

  @ApiPropertyOptional({
    description: "Frais d'inscription (en euros)",
    example: 5.0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        "Les frais d'inscription doivent être un nombre avec maximum 2 décimales",
    },
  )
  @Min(0, { message: "Les frais d'inscription ne peuvent pas être négatifs" })
  @Transform(({ value }) => parseFloat(value))
  entryFee?: number;

  @ApiPropertyOptional({
    description: 'Tournoi public ou privé',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPublic doit être un booléen' })
  @Transform(({ value }) => value == 'true' || value == true)
  isPublic?: boolean;
}
