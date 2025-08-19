import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { APP_FILTER } from '@nestjs/core';

export class FinishMatchDto {
	@ApiProperty({ example: 11, description: 'Score du joueur 1' })
	@IsNumber()
	@Min(0)
	@Max(11)
	player1Score: number;

	@ApiProperty({ example: 11, description: 'Score du joueur 2' })
	@IsNumber()
	@Min(0)
	@Max(11)
	player2Score: number;
}