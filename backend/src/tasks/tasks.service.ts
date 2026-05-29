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

  async findAll(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
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
