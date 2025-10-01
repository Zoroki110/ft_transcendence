import { IsOptional, IsNumber, IsPositive, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MatchHistoryQueryDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(100)
  @Type(() => Number)
  limit?: number = 20; // Par défaut 20 matches

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0; // Pour la pagination

  @IsOptional()
  @Type(() => String)
  status?: 'pending' | 'completed' | 'cancelled'; // Filtre par statut
}
