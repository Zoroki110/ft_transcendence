import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { PublicGameController } from './public-game.controller';
import { GameGateway } from './game.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), UsersModule],
  providers: [GameService, GameGateway],
  controllers: [GameController, PublicGameController],
  exports: [GameService, GameGateway],
})
export class GameModule {}
