import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private readonly gateway: TasksGateway,
  ) {}

  async findAll({
    userId,
    q,
    page,
    limit,
  }: {
    userId: string;
    q?: string;
    page: number;
    limit: number;
  }) {
    const where = {
      userId,
      ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    };

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.task.count({
        where,
      }),
    ]);

    return {
      data: tasks,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({ data: { ...dto, userId } });
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    const updated = await this.prisma.task.update({ where: { id }, data: dto });

    if (dto.status) {
      this.gateway.emitStatusChanged({
        id: updated.id,
        status: updated.status,
      });
    }

    return updated;
  }

  async remove(userId: string, id: string) {
    const task = await this.prisma.task.findFirst({ where: { id, userId } });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    return this.prisma.task.delete({ where: { id } });
  }
}
