// src/tournaments/tournaments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { Tournament } from '../entities/tournament.entity';
import { User } from '../entities/user.entity';
import { Match } from '../entities/match.entity';
import { GameModule } from '../game/game.module';
import { GameGateway } from '../game/game.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, User, Match]),
    GameModule, // Import du GameModule pour accéder à GameGateway
  ],
  controllers: [TournamentsController],
  providers: [
    TournamentsService,
    {
      provide: 'SOCKET_SERVER',
      useFactory: (gameGateway) => gameGateway.server,
      inject: [GameGateway]
    }
  ],
  exports: [TournamentsService],
})
export class TournamentsModule {}
