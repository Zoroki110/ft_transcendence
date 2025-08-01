// src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module'; // ✅ import your AuthModule
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule, // ✅ register it here
  ],
  controllers: [AppController],
})
export class AppModule {}
