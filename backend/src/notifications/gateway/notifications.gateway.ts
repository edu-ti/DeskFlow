import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      try {
        const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
        if (!authHeader) {
          return next(new Error('Authentication token is missing'));
        }
        const token = authHeader.replace('Bearer ', '');
        socket.data.user = this.jwtService.verify(token);
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    const userId = client.data.user?.sub;
    client.join(`user_${userId}`);
    this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNotificationToUser(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }
}