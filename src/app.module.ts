import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Charge les variables .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Initialise la connexion PostgreSQL via TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // À désactiver en prod pour éviter les DROP TABLE
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
