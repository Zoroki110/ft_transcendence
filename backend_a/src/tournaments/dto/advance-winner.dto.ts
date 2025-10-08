import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdvanceWinnerDto {
  @ApiProperty({ description: 'ID du joueur gagnant' })
  @IsNumber()
  @IsNotEmpty()
  winnerId: number;

  @ApiProperty({ description: 'Score du joueur 1' })
  @IsNumber()
  @IsNotEmpty()
  player1Score: number;

  @ApiProperty({ description: 'Score du joueur 2' })
  @IsNumber()
  @IsNotEmpty()
  player2Score: number;
}