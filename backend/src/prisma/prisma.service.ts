import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// PrismaService = PrismaClient + lifecycle хуки NestJS.
//
// В Prisma 7 PrismaClient требует driver adapter — клиент сам не общается с БД,
// этим занимается отдельный пакет @prisma/adapter-pg (под капотом обычный pg-драйвер).
// DATABASE_URL подгружается через ConfigService (он, в свою очередь, читает .env
// через ConfigModule из app.module.ts).
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
