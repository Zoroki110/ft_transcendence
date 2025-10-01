import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  player1Id: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  player2Id: number;
}
