// src/app/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

// Entities
import { User } from '../auth/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { Label } from '../labels/entities/label.entity';
import { TaskComment } from '../tasks/entities/task-comment.entity';
import { TaskAttachment } from '../tasks/entities/task-attachment.entity';
import { TaskActivity } from '../tasks/entities/task-activity.entity';

// Other modules
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Task,
      Project,
      Label,
      TaskComment,
      TaskAttachment,
      TaskActivity,
    ]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
