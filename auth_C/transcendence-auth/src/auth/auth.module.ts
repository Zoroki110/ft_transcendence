// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FtStrategy } from './oauth/ft.strategy';
import { JwtStrategy } from './jwt/jwt.strategy';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { UserService } from '../user/user.service';
import { TwoFAService } from './twofa/twofa.service';
import { TwoFAController } from './twofa/twofa.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_ACCESS_TOKEN_SECRET'), // JwtService still needs *a* default secret
        signOptions: { expiresIn: config.get('JWT_ACCESS_TOKEN_EXPIRATION') || '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, TwoFAController],
  providers: [AuthService, FtStrategy, JwtStrategy, JwtAuthGuard, UserService, TwoFAService],
})
export class AuthModule {}
