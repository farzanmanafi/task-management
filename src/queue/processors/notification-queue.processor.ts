import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationService } from '../../shared/services/notification.service';
import { NotificationJobData } from '../queue.service';

@Processor('notification')
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(private notificationService: NotificationService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<NotificationJobData>) {
    const { data } = job;

    try {
      this.logger.log(
        `Processing notification job: ${data.type} for user ${data.userId}`,
      );

      await this.sendNotificationToUser(data.userId, {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
      });

      this.logger.log(
        `Notification sent successfully: ${data.type} to user ${data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendNotificationToUser(
    userId: string,
    notificationData: any,
  ): Promise<void> {
    // Implement the actual notification sending logic here
    // This could call different methods based on notification type
    this.logger.log(
      `Sending notification to user ${userId}:`,
      notificationData,
    );
  }
}
