import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from '../services/notification.service';
import { EmailService } from '../services/email.service';
import { User } from '../../app/auth/entities/user.entity';
import { Task } from '../../app/tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Task]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  providers: [NotificationService, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
