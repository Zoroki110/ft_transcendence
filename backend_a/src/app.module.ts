// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { ChatModule } from './chat/chat.module';
import { HealthController } from './health/health.controller';
import { TournamentsModule } from './tournaments/tournaments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get<string>('DB_HOST', 'localhost'),
        port: parseInt(cfg.get<string>('DB_PORT', '5432'), 10),
        username: cfg.get('DB_USER') ?? cfg.get('DB_USERNAME'),
        password: cfg.get('DB_PASS') ?? cfg.get('DB_PASSWORD'),
        database: cfg.get<string>('DB_NAME', 'transcendance'),
        autoLoadEntities: true,
        synchronize:
          process.env.NODE_ENV !== 'production' &&
          cfg.get<string>('TYPEORM_SYNC') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    GameModule,
    ChatModule,
    TournamentsModule,
  ],
  providers: [],
  controllers: [HealthController],
})
export class AppModule {}
