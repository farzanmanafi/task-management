import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TasksModule } from './app/tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './app/config/typeorm.config';
import { ProjectsModule } from './app/projects/projects.module';
import { LabelsModule } from './app/labels/labels.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TasksModule,
    ProjectsModule,
    LabelsModule,
  ],
  providers: [AppService],
})
export class AppModule {}
