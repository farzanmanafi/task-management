import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
// import { TasksController } from './controllers/tasks.controller';

// Services
// import { TasksService } from './services/tasks.service';
import { TaskActivityService } from './services/task-activity.service';

// Entities
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/task-comment.entity';
import { TaskAttachment } from './entities/task-attachment.entity';
import { TaskActivity } from './entities/task-activity.entity';

// Other modules
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../../shared/cache/cache.module';
import { TaskService } from './services/tasks.service';
import { TasksController } from './tasks.controller';
// import { CacheModule } from '../../shared/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskComment, TaskAttachment, TaskActivity]),
    AuthModule,
    CacheModule,
  ],
  controllers: [TasksController],
  providers: [TaskService, TaskActivityService],
  exports: [TaskService, TaskActivityService],
})
export class TasksModule {}
