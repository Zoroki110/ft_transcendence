import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { PublicGameController } from './public-game.controller';
import { GameGateway } from './game.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Match])],
  providers: [GameService, GameGateway],
  controllers: [GameController, PublicGameController],
  exports: [GameService],
})
export class GameModule {}
