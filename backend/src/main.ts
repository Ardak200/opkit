import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS для фронта на http://localhost:3000.
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  // Глобальный ValidationPipe — он и заставляет class-validator работать
  // на каждом @Body() dto: SomeDto. Без него декораторы тупо игнорятся.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // вырезать поля, которых нет в DTO
      forbidNonWhitelisted: true, // или вообще ругаться 400 если такие пришли
      transform: true, // конвертить body в инстансы DTO-классов
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API готов на http://localhost:${port}`);
}
bootstrap();