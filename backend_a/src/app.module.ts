// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { ChatModule } from './chat/chat.module';
import { HealthController } from './health/health.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
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
        // true uniquement en dev si TYPEORM_SYNC=true dans .env
        synchronize:
          process.env.NODE_ENV !== 'production' &&
          cfg.get<string>('TYPEORM_SYNC') === 'true',
        // logging: true,
      }),
    }),
    UsersModule,
    AuthModule,
    GameModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass:ThrottlerGuard,
    },
  ],
  controllers: [HealthController],
})
export class AppModule {}
