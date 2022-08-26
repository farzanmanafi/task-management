import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TasksModule } from './app/tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './app/config/typeorm.config';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), TasksModule],
  providers: [AppService],
})
export class AppModule {}
