import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { TasksModule } from './app/tasks/tasks.module';
import { ProjectsModule } from './app/projects/projects.module';
import { LabelsModule } from './app/labels/labels.module';
import { AuthModule } from './app/auth/auth.module';

// Shared modules
import { CacheModule } from './shared/cache/cache.module';
import { SharedModule } from './shared/modules/shared.module';
import { FileUploadModule } from './shared/modules/file-upload.module';
import { NotificationModule } from './shared/modules/notification.module';

// Feature modules
import { HealthModule } from './health/health.module';
import { QueueModule } from './queue/queue.module';
import { WebSocketModule } from './websocket/websocket.module';
import { MonitoringModule } from './monitoring/monitoring.module';

// Configuration
import { getDatabaseConfig } from './config/database.config';
import { AppConfigModule } from './config/config.module';

// Guards
import { JwtAuthGuard } from './app/auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

// Services
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    AppConfigModule,

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),

    // Event system
    EventEmitterModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: Number(configService.get('RATE_LIMIT_TTL', 60)),
          limit: Number(configService.get('RATE_LIMIT_LIMIT', 100)),
        },
      ],
    }),

    // Queue system
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
        },
      }),
    }),

    // Shared modules
    SharedModule,
    CacheModule,
    FileUploadModule,
    NotificationModule,

    // Feature modules
    AuthModule,
    TasksModule,
    ProjectsModule,
    LabelsModule,
    HealthModule,
    QueueModule,
    WebSocketModule,
    MonitoringModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  constructor() {
    console.log('✅ Task Management API started successfully');
    console.log(
      'ℹ️  Admin panel is disabled. To enable it, install AdminJS packages.',
    );
  }
}

export default AppModule;
