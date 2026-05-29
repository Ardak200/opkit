import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
})
export class TasksModule {}
