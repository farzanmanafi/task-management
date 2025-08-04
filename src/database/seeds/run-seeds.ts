import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedModule } from './seed.module';
import { UserSeeder } from './user.seed';
import { ProjectSeeder } from './project.seed';
import { TaskSeeder } from './task.seed';
import { LabelSeeder } from './label.seed';

async function runSeeders() {
  console.log('Starting database seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

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
