import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() — модуль регистрируется один раз в AppModule, и его экспорты
// (PrismaService) становятся доступны во всех других модулях БЕЗ необходимости
// импортировать PrismaModule в каждом из них.
// Это распространённый трюк для "инфраструктурных" модулей: Prisma, Redis, Config.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}