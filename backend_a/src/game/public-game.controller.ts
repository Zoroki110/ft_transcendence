import { Controller, Post, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GameService } from './game.service';

@ApiTags('public-games')
@Controller('public-games')
export class PublicGameController {
  private readonly logger = new Logger('PublicGameController');

  constructor(private readonly gameService: GameService) {}

  @Post('quick-match')
  async createQuickMatch() {
    this.logger.log(`🔥 API CALL: /public-games/quick-match appelé à ${new Date().toISOString()}`);
    const result = await this.gameService.createQuickMatchWithWaiting();
    this.logger.log(`🔥 API RESPONSE: /public-games/quick-match retourne ->`, result);
    return result;
  }
}
