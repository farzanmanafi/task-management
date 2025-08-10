import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { getDatabaseConfig } from '../../config/database.config';
import { ConfigService } from '@nestjs/config';

import { UserSeeder } from './user.seed';
import { ProjectSeeder } from './project.seed';
import { TaskSeeder } from './task.seed';
import { LabelSeeder } from './label.seed';

// Import entities
import { User } from '../../app/auth/entities/user.entity';
import { Project } from '../../app/projects/entities/project.entity';
import { Task } from '../../app/tasks/entities/task.entity';
import { Label } from '../../app/labels/entities/label.entity';

// Create a dedicated seeding module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...getDatabaseConfig(configService),
        // Enable synchronize for seeding to auto-create tables
        synchronize: true,
        // Optionally enable logging to see what's happening
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Project, Task, Label]),
  ],
  providers: [UserSeeder, ProjectSeeder, TaskSeeder, LabelSeeder],
  exports: [UserSeeder, ProjectSeeder, TaskSeeder, LabelSeeder],
})
class SeedingModule {}

async function runSeeders() {
  console.log('Starting database seeding...');

  const app = await NestFactory.createApplicationContext(SeedingModule);

  try {
    // Run seeders in order
    const userSeeder = app.get(UserSeeder);
    await userSeeder.seed();

    const projectSeeder = app.get(ProjectSeeder);
    await projectSeeder.seed();

    const taskSeeder = app.get(TaskSeeder);
    await taskSeeder.seed();

    const labelSeeder = app.get(LabelSeeder);
    await labelSeeder.seed();

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  runSeeders();
}

export { runSeeders };
