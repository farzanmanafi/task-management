// src/websocket/websocket.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { WebSocketGateway } from './websocket.gateway';

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(private webSocketGateway: WebSocketGateway) {}

  @OnEvent('task.created')
  async handleTaskCreated(payload: { task: any; user: any }) {
    try {
      const { task, user } = payload;

      if (task.projectId) {
        await this.webSocketGateway.broadcastTaskCreated(
          task.projectId,
          task,
          user.id,
        );
      }

      this.logger.log(`Broadcasted task created: ${task.id}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast task created: ${error.message}`);
    }
  }

  @OnEvent('task.updated')
  async handleTaskUpdated(payload: { task: any; user: any }) {
    try {
      const { task, user } = payload;

      await this.webSocketGateway.broadcastTaskUpdate(task.id, task, user.id);

      this.logger.log(`Broadcasted task updated: ${task.id}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast task updated: ${error.message}`);
    }
  }

  @OnEvent('task.deleted')
  async handleTaskDeleted(payload: { task: any; user: any }) {
    try {
      const { task, user } = payload;

      await this.webSocketGateway.broadcastTaskDeleted(
        task.id,
        task.projectId,
        user.id,
      );

      this.logger.log(`Broadcasted task deleted: ${task.id}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast task deleted: ${error.message}`);
    }
  }

  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: {
    task: any;
    user: any;
    assigneeId: string;
  }) {
    try {
      const { task, user, assigneeId } = payload;

      await this.webSocketGateway.broadcastTaskAssigned(
        task.id,
        assigneeId,
        user.id,
      );

      this.logger.log(`Broadcasted task assigned: ${task.id} to ${assigneeId}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast task assigned: ${error.message}`);
    }
  }

  @OnEvent('comment.added')
  async handleCommentAdded(payload: {
    taskId: string;
    comment: any;
    user: any;
  }) {
    try {
      const { taskId, comment, user } = payload;

      await this.webSocketGateway.broadcastCommentAdded(
        taskId,
        comment,
        user.id,
      );

      this.logger.log(`Broadcasted comment added to task: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast comment added: ${error.message}`);
    }
  }

  @OnEvent('project.updated')
  async handleProjectUpdated(payload: { project: any; user: any }) {
    try {
      const { project, user } = payload;

      await this.webSocketGateway.broadcastProjectUpdate(
        project.id,
        project,
        user.id,
      );

      this.logger.log(`Broadcasted project updated: ${project.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast project updated: ${error.message}`,
      );
    }
  }

  async notifyUser(userId: string, notification: any) {
    try {
      await this.webSocketGateway.notifyUser(userId, notification);
      this.logger.log(`Notification sent to user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to notify user: ${error.message}`);
    }
  }

  async getConnectedUsers() {
    return await this.webSocketGateway.getConnectedUsers();
  }

  async getConnectedUsersInProject(projectId: string) {
    return await this.webSocketGateway.getConnectedUsersInProject(projectId);
  }
}
