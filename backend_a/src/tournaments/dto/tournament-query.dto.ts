import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class TournamentQueryDto {
	@ApiProperty({
		description: 'Status du tournoi à filtrer',
		required: false,
		example: 'open'
	})
	@IsOptional()
	@IsString()
	status?: string;

	@ApiProperty({
		description: 'Type de tournoi a filtrer',
		required: false,
		example: 'single_elimination'
	})
	@IsOptional()
	@IsString()
	type?: string;

	@ApiProperty({
		description: 'Uniquement les tournois publics',
		required: false,
		example: true
	})
	@IsOptional()
	isPublic?: boolean;

	@ApiProperty({
		description: 'Nombre de resultat par page',
		required: false,
		example: 10,
		default: 10
	})
	@IsOptional()
	limit?: number;

	@ApiProperty({
		description: 'Numero de page',
		required: false,
		example: 1,
		default: 1
	})
	@IsOptional()
	page?: number;
}