// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { FtStrategy } from './oauth/ft.strategy';

@Module({
  imports: [
    ConfigModule,
    UsersModule, // important pour injecter UsersService dans AuthService
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_ACCESS_SECRET') ?? cfg.get('JWT_SECRET') ?? 'change-me',
        signOptions: { expiresIn: cfg.get('JWT_ACCESS_TTL') ?? '15m' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, FtStrategy],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
