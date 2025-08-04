// src/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailQueueProcessor } from './processors/email-queue.processor';
import { NotificationQueueProcessor } from './processors/notification-queue.processor';
import { ReportQueueProcessor } from './processors/report-queue.processor';
import { FileProcessingQueueProcessor } from './processors/file-processing-queue.processor';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { NotificationModule } from '../shared/modules/notification.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_QUEUE_DB', 2),
        },
        defaultJobOptions: {
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notification' },
      { name: 'report' },
      { name: 'file-processing' },
    ),
    NotificationModule,
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    EmailQueueProcessor,
    NotificationQueueProcessor,
    ReportQueueProcessor,
    FileProcessingQueueProcessor,
  ],
  exports: [QueueService],
})
export class QueueModule {}
