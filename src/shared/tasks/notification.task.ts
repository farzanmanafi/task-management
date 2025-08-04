import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class NotificationTask {
  private readonly logger = new Logger(NotificationTask.name);

  constructor(private notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleOverdueTaskNotifications(): Promise<void> {
    this.logger.log('Running overdue task notifications...');
    try {
      await this.notificationService.sendOverdueTaskNotifications();
      this.logger.log('Overdue task notifications completed');
    } catch (error) {
      this.logger.error('Failed to send overdue task notifications:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyDigest(): Promise<void> {
    this.logger.log('Running daily digest...');
    try {
      await this.notificationService.sendDailyDigest();
      this.logger.log('Daily digest completed');
    } catch (error) {
      this.logger.error('Failed to send daily digest:', error);
    }
  }
}
