// src/admin/simple-admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import your entities
import { User } from '../app/auth/entities/user.entity';
import { Task } from '../app/tasks/entities/task.entity';
import { Project } from '../app/projects/entities/project.entity';
import { Label } from '../app/labels/entities/label.entity';
import { TaskComment } from '../app/tasks/entities/task-comment.entity';
import { SimpleAdminController } from './simple-admin.controller';
import { SimpleAdminService } from './simple-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Task, Project, Label, TaskComment]),
  ],
  controllers: [SimpleAdminController],
  providers: [SimpleAdminService],
})
export class SimpleAdminModule {}
