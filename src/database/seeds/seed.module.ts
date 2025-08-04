import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../app/auth/entities/user.entity';
import { Project } from '../../app/projects/entities/project.entity';
import { Task } from '../../app/tasks/entities/task.entity';
import { Label } from '../../app/labels/entities/label.entity';
import { UserSeeder } from './user.seed';
import { ProjectSeeder } from './project.seed';
import { TaskSeeder } from './task.seed';
import { LabelSeeder } from './label.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project, Task, Label])],
  providers: [UserSeeder, ProjectSeeder, TaskSeeder, LabelSeeder],
  exports: [UserSeeder, ProjectSeeder, TaskSeeder, LabelSeeder],
})
export class SeedModule {}
