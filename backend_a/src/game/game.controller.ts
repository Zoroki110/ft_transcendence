import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Query,
  ParseIntPipe,
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GameService } from './game.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { FinishMatchDto } from './dto/finish-match.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('games')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('games')
export class GameController {
	constructor(private readonly gameService: GameService) {}

	@Post('matches')
	createMatch(@Body() createMatchDto: CreateMatchDto) {
		return this.gameService.createMatch(createMatchDto);
	}

	@Get('matches')
	@ApiQuery({ name: 'status', required: false })
	findAllMatches(@Query('status') status?: string) {
		return this.gameService.findAllMatches(status);
	}

	@Get('matches/:id')
	findOneMatch(@Param('id', ParseIntPipe) id: number) {
		return this.gameService.findOneMatch(id);
	}

	@Patch('matches/:id/finish')
	finishMatch(
		@Param('id', ParseIntPipe) id: number,
		@Body() finishMatchDto: FinishMatchDto,
	) {
		return this.gameService.finishMatch(id, finishMatchDto);
	}
}