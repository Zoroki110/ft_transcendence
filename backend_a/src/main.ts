import '../../global-crypto';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV == 'production',
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  if (process.env.NODE_ENV != 'production') {
    const config = new DocumentBuilder()
      .setTitle('Transcendence API')
      .setDescription('API Backend ft_transcendence')
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Backend running on http://localhost:${port}`);
  if (process.env.NODE_ENV != 'production') {
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
  }
}
bootstrap();
