import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { CreateMatchDto } from './dto/create-match.dto';
import { FinishMatchDto } from './dto/finish-match.dto';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@ApiTags('games')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('games')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
  ) {}

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

  @Post('quick-match')
  createQuickMatch() {
    return this.gameService.createQuickMatchWithWaiting();
  }

  @Get('waiting-rooms/count')
  getWaitingRoomsCount() {
    return {
      count: this.gameService.getWaitingRoomsCount(),
    };
  }

  // Nouveaux endpoints pour les lobbys
  @Post('lobbys')
  createLobby(@Request() req) {
    const user = req.user;
    console.log('🔍 DEBUG createLobby req.user:', user);
    console.log('🔍 DEBUG user.sub:', user?.sub);
    console.log('🔍 DEBUG user.username:', user?.username);
    console.log('🔍 DEBUG user.avatar:', user?.avatar);
    
    // JWT payload has 'sub' field for user ID, not 'id'
    const userId = user.sub;
    const username = user.username;
    const avatar = user.avatar || null; // avatar might not be in JWT payload
    
    return this.gameService.createLobby(userId, username, avatar);
  }

  @Get('lobbys')
  getAllLobbys() {
    return this.gameService.getAllWaitingLobbys();
  }

  @Post('lobbys/:lobbyId/join')
  joinLobby(@Param('lobbyId') lobbyId: string, @Request() req) {
    const user = req.user;
    console.log('🔍 DEBUG joinLobby req.user:', user);
    console.log('🔍 DEBUG user.sub:', user?.sub);
    console.log('🔍 DEBUG user.username:', user?.username);
    
    // JWT payload has 'sub' field for user ID, not 'id'
    const userId = user.sub;
    const username = user.username;
    
    return this.gameService.joinLobby(lobbyId, userId, username);
  }
}
