import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { FinishMatchDto } from './dto/finish-match.dto';

@Injectable()
export class GameService {
	constructor(
		@InjectRepository(Match)
		private matchRepo: Repository<Match>,
	) {}

	async createMatch(createMatchDto: CreateMatchDto) {
		const match = this.matchRepo.create({
			player1: { id: createMatchDto.player1Id },
			player2: { id: createMatchDto.player2Id },
			status: 'pending',
		});
		return this.matchRepo.save(match);
	}

	async findAllMatches(status?: string) {
		const where = status ? { status } : {};
		return this.matchRepo.find({
			where,
			relations: ['player1', 'player2'],
			select: {
				player1: { id: true, username: true },
				player2: { id: true, username: true },
			},
		});
	}

	async findOneMatch(id: number) {
		const match = await this.matchRepo.findOne({
			where: { id },
			relations: ['player1', 'player2'],
			select: {
				player1: { id: true, username: true, avatar: true },
				player2: { id: true, username: true, avatar: true },
			},
		});
		if (!match) {
			throw new NotFoundException(`Match ${id} not found`);
		}
		return match;
	}

	async finishMatch(id: number, finishMatchDto: FinishMatchDto) {
		const match = await this.findOneMatch(id);

		Object.assign(match, {
			player1Score: finishMatchDto.player1Score,
			player2Score: finishMatchDto.player2Score,
			status: 'finished',
			finishedAt: new Date(),
		});

		return this.matchRepo.save(match);
	}
}