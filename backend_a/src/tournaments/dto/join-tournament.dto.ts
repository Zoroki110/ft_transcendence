import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinTournamentDto {
  @ApiProperty({
    description: 'Message de motivation',
    example: 'Pret a defier tout le monde !',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Le message ne peut pas dépasser 200 caractères' })
  message?: string;
}
