import {
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
  WebSocketGateway,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../app/auth/repositories/user.repository';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { CurrentUser } from '../app/auth/decorators/current-user.decorator';
import { User } from '../app/auth/entities/user.entity';
import { CacheService } from 'src/shared/cache/cache.service';

interface ConnectedClient {
  id: string;
  userId: string;
  user: User;
  rooms: Set<string>;
  lastSeen: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(WebSocketGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
    private cacheService: CacheService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const user = await this.validateToken(token);
      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid token`);
        client.disconnect();
        return;
      }

      const connectedClient: ConnectedClient = {
        id: client.id,
        userId: user.id,
        user,
        rooms: new Set(),
        lastSeen: new Date(),
      };

      this.connectedClients.set(client.id, connectedClient);

      // Join user-specific room
      client.join(`user:${user.id}`);
      connectedClient.rooms.add(`user:${user.id}`);

      // Update user's online status
      await this.updateUserOnlineStatus(user.id, true);

      // Send welcome message
      client.emit('connected', {
        message: 'Connected successfully',
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`User ${user.username} connected (${client.id})`);
    } catch (error) {
      this.logger.error(
        `Connection error for client ${client.id}: ${error.message}`,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const connectedClient = this.connectedClients.get(client.id);
    if (connectedClient) {
      // Update user's online status
      await this.updateUserOnlineStatus(connectedClient.userId, false);

      // Leave all rooms
      connectedClient.rooms.forEach((room) => {
        client.leave(room);
      });

      this.connectedClients.delete(client.id);
      this.logger.log(
        `User ${connectedClient.user.username} disconnected (${client.id})`,
      );
    }
  }

  @SubscribeMessage('join-project')
  @UseGuards(WsAuthGuard)
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
    @CurrentUser() user: User,
  ) {
    try {
      const { projectId } = data;

      // Validate project access
      const hasAccess = await this.validateProjectAccess(user.id, projectId);
      if (!hasAccess) {
        client.emit('error', { message: 'Access denied to project' });
        return;
      }

      const connectedClient = this.connectedClients.get(client.id);
      if (connectedClient) {
        const roomName = `project:${projectId}`;
        client.join(roomName);
        connectedClient.rooms.add(roomName);

        client.emit('joined-project', {
          projectId,
          message: 'Successfully joined project room',
        });

        // Notify other users in the project
        client.to(roomName).emit('user-joined-project', {
          userId: user.id,
          username: user.username,
          projectId,
        });

        this.logger.log(`User ${user.username} joined project ${projectId}`);
      }
    } catch (error) {
      this.logger.error(`Join project error: ${error.message}`);
      client.emit('error', { message: 'Failed to join project' });
    }
  }

  @SubscribeMessage('leave-project')
  @UseGuards(WsAuthGuard)
  async handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
    @CurrentUser() user: User,
  ) {
    try {
      const { projectId } = data;
      const connectedClient = this.connectedClients.get(client.id);

      if (connectedClient) {
        const roomName = `project:${projectId}`;
        client.leave(roomName);
        connectedClient.rooms.delete(roomName);

        client.emit('left-project', {
          projectId,
          message: 'Successfully left project room',
        });

        // Notify other users in the project
        client.to(roomName).emit('user-left-project', {
          userId: user.id,
          username: user.username,
          projectId,
        });

        this.logger.log(`User ${user.username} left project ${projectId}`);
      }
    } catch (error) {
      this.logger.error(`Leave project error: ${error.message}`);
      client.emit('error', { message: 'Failed to leave project' });
    }
  }

  @SubscribeMessage('typing')
  @UseGuards(WsAuthGuard)
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string; isTyping: boolean },
    @CurrentUser() user: User,
  ) {
    try {
      const { taskId, isTyping } = data;
      const roomName = `task:${taskId}`;

      client.to(roomName).emit('user-typing', {
        userId: user.id,
        username: user.username,
        taskId,
        isTyping,
      });
    } catch (error) {
      this.logger.error(`Typing event error: ${error.message}`);
    }
  }

  @SubscribeMessage('ping')
  @UseGuards(WsAuthGuard)
  async handlePing(
    @ConnectedSocket() client: Socket,
    @CurrentUser() user: User,
  ) {
    const connectedClient = this.connectedClients.get(client.id);
    if (connectedClient) {
      connectedClient.lastSeen = new Date();
    }

    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }

  // Public methods for broadcasting events
  async broadcastTaskUpdate(taskId: string, task: any, userId: string) {
    this.server.to(`task:${taskId}`).emit('task-updated', {
      taskId,
      task,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastTaskCreated(projectId: string, task: any, userId: string) {
    this.server.to(`project:${projectId}`).emit('task-created', {
      projectId,
      task,
      createdBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastTaskDeleted(
    taskId: string,
    projectId: string,
    userId: string,
  ) {
    this.server.to(`project:${projectId}`).emit('task-deleted', {
      taskId,
      projectId,
      deletedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastTaskAssigned(
    taskId: string,
    assigneeId: string,
    assignedBy: string,
  ) {
    // Notify the assignee
    this.server.to(`user:${assigneeId}`).emit('task-assigned', {
      taskId,
      assignedBy,
      timestamp: new Date().toISOString(),
    });

    // Notify task room
    this.server.to(`task:${taskId}`).emit('task-assignment-changed', {
      taskId,
      assigneeId,
      assignedBy,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastCommentAdded(taskId: string, comment: any, userId: string) {
    this.server.to(`task:${taskId}`).emit('comment-added', {
      taskId,
      comment,
      addedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastProjectUpdate(
    projectId: string,
    project: any,
    userId: string,
  ) {
    this.server.to(`project:${projectId}`).emit('project-updated', {
      projectId,
      project,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  async broadcastUserStatusChange(userId: string, isOnline: boolean) {
    this.server.emit('user-status-changed', {
      userId,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  async notifyUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  async getConnectedUsers(): Promise<
    { userId: string; username: string; lastSeen: Date }[]
  > {
    return Array.from(this.connectedClients.values()).map((client) => ({
      userId: client.userId,
      username: client.user.username,
      lastSeen: client.lastSeen,
    }));
  }

  async getConnectedUsersInProject(projectId: string): Promise<string[]> {
    const room = this.server.sockets.adapter.rooms.get(`project:${projectId}`);
    if (!room) return [];

    const userIds = new Set<string>();
    room.forEach((socketId) => {
      const client = this.connectedClients.get(socketId);
      if (client) {
        userIds.add(client.userId);
      }
    });

    return Array.from(userIds);
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const token =
      client.request.headers.authorization?.replace('Bearer ', '') ||
      client.handshake.auth.token ||
      client.handshake.query.token;
    return token as string;
  }

  private async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      });

      const user = await this.userRepository.findById(payload.sub);
      return user && user.isActive ? user : null;
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  private async validateProjectAccess(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    // Implementation depends on your project access logic
    // This is a placeholder
    return true;
  }

  private async updateUserOnlineStatus(
    userId: string,
    isOnline: boolean,
  ): Promise<void> {
    try {
      await this.cacheService.set(`user:${userId}:online`, isOnline, 3600);
      this.broadcastUserStatusChange(userId, isOnline);
    } catch (error) {
      this.logger.error(
        `Failed to update user online status: ${error.message}`,
      );
    }
  }
}
