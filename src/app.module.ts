// src/app.module.ts
import { Module, Logger } from '@nestjs/common';
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

// Admin modules - both options available
// import { AdminModule } from './app/admin/admin.module'; // Custom admin (recommended)
// import { AdminPanelModule } from './app/admin-panel/admin-panel.module'; // AdminJS option

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
import { AdminPannelModule } from './app/admin-pannel/admin-panel.module';
import { AdminModule } from './app/admin-pannel/admin.module';

// Admin panel configuration
const getAdminModules = () => {
  const logger = new Logger('AdminSetup');

  // Option 1: Try AdminJS (advanced but complex)
  let adminJSModule = null;
  try {
    // Check if AdminJS packages are available
    require('@adminjs/nestjs');
    require('adminjs');
    require('@adminjs/typeorm');

    adminJSModule = AdminPannelModule.forRootAsync();
    if (adminJSModule) {
      logger.log('✅ AdminJS panel initialized successfully');
      logger.log('   Available at: /admin');
      logger.log('   Login: admin@taskmanagement.com / admin123');
    }
  } catch (error) {
    logger.warn('⚠️  AdminJS packages not found or incompatible');
    logger.warn(
      '   Install with: npm install @adminjs/nestjs adminjs @adminjs/typeorm',
    );
  }

  // Option 2: Custom admin panel (recommended - always available)
  logger.log('✅ Custom admin panel initialized');
  logger.log('   Available at: /admin (API endpoints)');
  logger.log('   Requires admin role authentication');

  // Return available modules
  const modules = [AdminModule]; // Always include custom admin
  if (adminJSModule) {
    modules.push(adminJSModule);
  }

  return modules;
};

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

    // Admin modules
    ...getAdminModules(),
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
  private readonly logger = new Logger(AppModule.name);

  constructor() {
    this.logger.log('🚀 Task Management API started successfully');
    this.logger.log('📚 API Documentation: /api/docs');
    this.logger.log('🏥 Health Check: /health');
    this.logger.log('👤 Admin Panel: /admin');
    this.logger.log('📊 Queue Monitor: /admin/queues (if available)');
  }
}
