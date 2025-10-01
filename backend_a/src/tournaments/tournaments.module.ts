// src/tournaments/tournaments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import { Tournament } from '../entities/tournament.entity';
import { User } from '../entities/user.entity';
import { Match } from '../entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, User, Match])], // ← Ajouter User et Match
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
