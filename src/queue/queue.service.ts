// src/queue/queue.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';
import { OnEvent } from '@nestjs/event-emitter';

export interface EmailJobData {
  type:
    | 'welcome'
    | 'task-assigned'
    | 'task-completed'
    | 'password-reset'
    | 'daily-digest';
  to: string;
  subject: string;
  template?: string;
  context?: any;
  priority?: number;
  delay?: number;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: number;
}

export interface ReportJobData {
  userId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'project';
  parameters: any;
  format: 'pdf' | 'excel' | 'csv';
}

export interface FileProcessingJobData {
  filePath: string;
  type: 'image-resize' | 'document-convert' | 'virus-scan';
  options?: any;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('report') private reportQueue: Queue,
    @InjectQueue('file-processing') private fileProcessingQueue: Queue,
  ) {}

  // Getter methods for Bull Board
  getEmailQueue(): Queue {
    return this.emailQueue;
  }

  getNotificationQueue(): Queue {
    return this.notificationQueue;
  }

  getReportQueue(): Queue {
    return this.reportQueue;
  }

  getFileProcessingQueue(): Queue {
    return this.fileProcessingQueue;
  }

  // Email queue methods
  async addEmailJob(data: EmailJobData, options?: JobOptions): Promise<void> {
    try {
      const jobOptions: JobOptions = {
        priority: data.priority || 0,
        delay: data.delay || 0,
        ...options,
      };

      await this.emailQueue.add('send-email', data, jobOptions);
      this.logger.log(`Email job added: ${data.type} to ${data.to}`);
    } catch (error) {
      this.logger.error(`Failed to add email job: ${error.message}`);
      throw error;
    }
  }

  async addBulkEmailJobs(
    jobs: EmailJobData[],
    options?: JobOptions,
  ): Promise<void> {
    try {
      const bulkJobs = jobs.map((data) => ({
        name: 'send-email',
        data,
        opts: {
          priority: data.priority || 0,
          delay: data.delay || 0,
          ...options,
        },
      }));

      await this.emailQueue.addBulk(bulkJobs);
      this.logger.log(`${jobs.length} email jobs added to queue`);
    } catch (error) {
      this.logger.error(`Failed to add bulk email jobs: ${error.message}`);
      throw error;
    }
  }

  // Notification queue methods
  async addNotificationJob(
    data: NotificationJobData,
    options?: JobOptions,
  ): Promise<void> {
    try {
      const jobOptions: JobOptions = {
        priority: data.priority || 0,
        ...options,
      };

      await this.notificationQueue.add('send-notification', data, jobOptions);
      this.logger.log(
        `Notification job added: ${data.type} for user ${data.userId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to add notification job: ${error.message}`);
      throw error;
    }
  }

  // Report queue methods
  async addReportJob(data: ReportJobData, options?: JobOptions): Promise<void> {
    try {
      const jobOptions: JobOptions = {
        priority: 1, // Reports have higher priority
        ...options,
      };

      await this.reportQueue.add('generate-report', data, jobOptions);
      this.logger.log(`Report job added: ${data.type} for user ${data.userId}`);
    } catch (error) {
      this.logger.error(`Failed to add report job: ${error.message}`);
      throw error;
    }
  }

  // File processing queue methods
  async addFileProcessingJob(
    data: FileProcessingJobData,
    options?: JobOptions,
  ): Promise<void> {
    try {
      await this.fileProcessingQueue.add('process-file', data, options);
      this.logger.log(
        `File processing job added: ${data.type} for ${data.filePath}`,
      );
    } catch (error) {
      this.logger.error(`Failed to add file processing job: ${error.message}`);
      throw error;
    }
  }

  // Event handlers
  @OnEvent('user.registered')
  async handleUserRegistered(payload: { user: any }): Promise<void> {
    await this.addEmailJob({
      type: 'welcome',
      to: payload.user.email,
      subject: 'Welcome to Task Management',
      template: 'welcome',
      context: {
        userName: payload.user.fullName,
        loginUrl: process.env.FRONTEND_URL + '/login',
      },
      priority: 10,
    });
  }

  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: {
    task: any;
    assignee: any;
    assignedBy: any;
  }): Promise<void> {
    await this.addEmailJob({
      type: 'task-assigned',
      to: payload.assignee.email,
      subject: 'New Task Assigned',
      template: 'task-assigned',
      context: {
        taskTitle: payload.task.title,
        assignedBy: payload.assignedBy.fullName,
        taskUrl: process.env.FRONTEND_URL + `/tasks/${payload.task.id}`,
      },
      priority: 5,
    });

    await this.addNotificationJob({
      userId: payload.assignee.id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${payload.assignedBy.fullName} assigned you a task: ${payload.task.title}`,
      data: { taskId: payload.task.id },
      priority: 5,
    });
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(payload: {
    task: any;
    completedBy: any;
    creator: any;
  }): Promise<void> {
    if (payload.creator.id !== payload.completedBy.id) {
      await this.addEmailJob({
        type: 'task-completed',
        to: payload.creator.email,
        subject: 'Task Completed',
        template: 'task-completed',
        context: {
          taskTitle: payload.task.title,
          completedBy: payload.completedBy.fullName,
          taskUrl: process.env.FRONTEND_URL + `/tasks/${payload.task.id}`,
        },
        priority: 3,
      });
    }
  }

  @OnEvent('file.uploaded')
  async handleFileUploaded(payload: {
    filePath: string;
    type: string;
    options?: any;
  }): Promise<void> {
    await this.addFileProcessingJob({
      filePath: payload.filePath,
      type: payload.type as any,
      options: payload.options,
    });
  }

  // Queue statistics
  async getQueueStats(): Promise<any> {
    const [emailStats, notificationStats, reportStats, fileProcessingStats] =
      await Promise.all([
        this.getQueueStatistics(this.emailQueue),
        this.getQueueStatistics(this.notificationQueue),
        this.getQueueStatistics(this.reportQueue),
        this.getQueueStatistics(this.fileProcessingQueue),
      ]);

    return {
      email: emailStats,
      notification: notificationStats,
      report: reportStats,
      fileProcessing: fileProcessingStats,
    };
  }

  private async getQueueStatistics(queue: Queue): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  // Queue management
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  async clearQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.empty();
    this.logger.log(`Queue ${queueName} cleared`);
  }

  private getQueue(queueName: string): Queue {
    switch (queueName) {
      case 'email':
        return this.emailQueue;
      case 'notification':
        return this.notificationQueue;
      case 'report':
        return this.reportQueue;
      case 'file-processing':
        return this.fileProcessingQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}
