import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(helmet());

  const corsOrigins = (configService.get<string>('CORS_ORIGINS') || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins.length ? corsOrigins : true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DeskFlow API')
    .setDescription('API do DeskFlow — helpdesk omnicanal (tickets, chat, WhatsApp, chamadas)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Serve static files (uploads)
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API docs: http://localhost:${port}/api/docs`);
}

bootstrap();