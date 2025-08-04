import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { CacheService } from '../cache/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../app/auth/entities/user.entity';
import { Task } from '../../app/tasks/entities/task.entity';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  taskOverdue: boolean;
  projectInvitation: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private emailService: EmailService,
    private eventEmitter: EventEmitter2,
    private cacheService: CacheService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: {
    task: Task;
    user: User;
    assigneeId: string;
  }): Promise<void> {
    try {
      const { task, user, assigneeId } = payload;

      if (!assigneeId) return;

      const assignee = await this.userRepository.findOne({
        where: { id: assigneeId },
      });
      if (!assignee) return;

      const preferences = await this.getUserNotificationPreferences(assigneeId);

      if (preferences.email && preferences.taskAssigned) {
        await this.emailService.sendTaskAssignedEmail(
          assignee.email,
          task.title,
          user.fullName,
        );
      }

      // Create in-app notification
      if (preferences.inApp) {
        await this.createInAppNotification(assigneeId, {
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `${user.fullName} assigned you a task: ${task.title}`,
          data: { taskId: task.id },
        });
      }

      this.logger.log(`Task assigned notification sent to user: ${assigneeId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle task assigned event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(payload: {
    task: Task;
    user: User;
  }): Promise<void> {
    try {
      const { task, user } = payload;

      // Notify task creator if different from completer
      if (task.createdById !== user.id) {
        const creator = await this.userRepository.findOne({
          where: { id: task.createdById },
        });
        if (creator) {
          const preferences = await this.getUserNotificationPreferences(
            creator.id,
          );

          if (preferences.email && preferences.taskCompleted) {
            await this.emailService.sendTaskCompletedEmail(
              creator.email,
              task.title,
              user.fullName,
            );
          }
        }
      }

      // Notify project manager or other stakeholders
      // Implementation depends on your business logic

      this.logger.log(`Task completed notification sent for task: ${task.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle task completed event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('user.registered')
  async handleUserRegistered(payload: { user: User }): Promise<void> {
    try {
      const { user } = payload;

      await this.emailService.sendWelcomeEmail(user.email, user.fullName);

      this.logger.log(`Welcome email sent to user: ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendOverdueTaskNotifications(): Promise<void> {
    try {
      const overdueTasks = await this.getOverdueTasks();

      for (const task of overdueTasks) {
        if (task.assigneeId) {
          const assignee = await this.userRepository.findOne({
            where: { id: task.assigneeId },
          });
          if (assignee) {
            const preferences = await this.getUserNotificationPreferences(
              assignee.id,
            );

            if (preferences.email && preferences.taskOverdue) {
              await this.emailService.sendTaskOverdueEmail(
                assignee.email,
                task.title,
                task.dueDate,
              );
            }
          }
        }
      }

      this.logger.log(
        `Overdue task notifications sent for ${overdueTasks.length} tasks`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send overdue task notifications: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendDailyDigest(): Promise<void> {
    try {
      const users = await this.userRepository.find({
        where: { isActive: true },
      });

      for (const user of users) {
        const preferences = await this.getUserNotificationPreferences(user.id);

        if (preferences.email && preferences.dailyDigest) {
          const tasks = await this.getUserTasks(user.id);
          const stats = await this.getUserStats(user.id);

          await this.emailService.sendDailyDigestEmail(
            user.email,
            tasks,
            stats,
          );
        }
      }

      this.logger.log('Daily digest emails sent');
    } catch (error) {
      this.logger.error(
        `Failed to send daily digest: ${error.message}`,
        error.stack,
      );
    }
  }

  private async getUserNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferences> {
    const cacheKey = `user_preferences:${userId}`;
    let preferences = await this.cacheService.get<NotificationPreferences>(
      cacheKey,
    );

    if (!preferences) {
      // Load from database or use defaults
      preferences = {
        email: true,
        push: true,
        inApp: true,
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        projectInvitation: true,
        dailyDigest: false,
        weeklyReport: false,
      };

      await this.cacheService.set(cacheKey, preferences, 3600); // 1 hour
    }

    return preferences;
  }

  private async createInAppNotification(
    userId: string,
    notification: any,
  ): Promise<void> {
    // Implementation would store in-app notification in database
    // This is a placeholder
    this.logger.log(`In-app notification created for user: ${userId}`);
  }

  private async getOverdueTasks(): Promise<Task[]> {
    // Implementation would fetch overdue tasks from database
    // This is a placeholder
    return [];
  }

  private async getUserTasks(userId: string): Promise<any[]> {
    // Implementation would fetch user tasks from database
    // This is a placeholder
    return [];
  }

  private async getUserStats(userId: string): Promise<any> {
    // Implementation would calculate user stats
    // This is a placeholder
    return {};
  }
}
