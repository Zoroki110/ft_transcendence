import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChallengeDto {
  @ApiProperty({ description: 'ID of the user being challenged' })
  @IsInt()
  challengedId: number;

  @ApiPropertyOptional({ description: 'Optional message with the challenge' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
