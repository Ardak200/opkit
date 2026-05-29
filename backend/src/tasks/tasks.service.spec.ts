import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { TasksGateway } from './tasks.gateway';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from '../generated/prisma/enums';

const mockPrisma = {
  task: {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockGateway = {
  emitStatusChanged: jest.fn(),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TasksGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get(TasksService);
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('выбрасывает NotFoundException если задача не найдена', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(service.update('user1', 'task1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('вызывает emitStatusChanged когда меняется статус', async () => {
      const task = { id: 'task1', status: TaskStatus.IN_PROGRESS };
      mockPrisma.task.findFirst.mockResolvedValue(task);
      mockPrisma.task.update.mockResolvedValue(task);

      await service.update('user1', 'task1', {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(mockGateway.emitStatusChanged).toHaveBeenCalledWith({
        id: 'task1',
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it('НЕ вызывает emitStatusChanged если статус не менялся', async () => {
      const task = { id: 'task1', title: 'old', status: TaskStatus.TODO };
      mockPrisma.task.findFirst.mockResolvedValue(task);
      mockPrisma.task.update.mockResolvedValue({ ...task, title: 'new' });

      await service.update('user1', 'task1', { title: 'new' });

      expect(mockGateway.emitStatusChanged).not.toHaveBeenCalled();
    });
  });
});
