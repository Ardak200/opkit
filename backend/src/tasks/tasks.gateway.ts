import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { TaskStatus } from '../generated/prisma/enums';

@WebSocketGateway({
  cors: { origin: ['http://localhost:3000', 'http://localhost:3002'], credentials: true },
})
export class TasksGateway {
  @WebSocketServer()
  private server!: Server;

  emitStatusChanged(payload: { id: string; status: TaskStatus }) {
    this.server.emit('task.statusChanged', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }
}
