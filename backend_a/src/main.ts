import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Pipes globaux : validation + transformation automatique
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // ignore les props non attendues
      forbidNonWhitelisted: true,  // renvoie une erreur si props inconnues
      transform: true,             // convertit automatiquement les types (string → number, etc.)
    }),
  );

  // ✅ CORS (pour que le front puisse appeler ton backend)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // ✅ Swagger (doc API)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Transcendence API')
      .setDescription('Documentation de l’API Backend A')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  // ✅ Port configurable par .env
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend A is running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📑 Swagger docs: http://localhost:${port}/api-docs`);
  }
}
bootstrap();
