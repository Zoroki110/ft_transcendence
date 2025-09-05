import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { GameService } from './game.service';
import { GameController } from './game.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Match])],
  providers: [GameService],
  controllers: [GameController],
  exports: [GameService],
})
export class GameModule {}