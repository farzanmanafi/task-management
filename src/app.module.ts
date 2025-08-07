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

// Optional AdminJS setup with better error handling
const createAdminModule = () => {
  try {
    // Dynamic import with CommonJS require
    const { AdminModule } = eval('require')('@adminjs/nestjs');
    const AdminJS = eval('require')('adminjs');
    const { Database, Resource } = eval('require')('@adminjs/typeorm');

    // Register the adapter
    AdminJS.registerAdapter({ Database, Resource });

    return AdminModule.createAdminAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        adminJsOptions: {
          rootPath: '/admin',
          resources: [],
          branding: {
            companyName: 'Task Management System',
          },
        },
        auth: {
          authenticate: async (email: string, password: string) => {
            // Simple authentication - replace with your logic
            const adminEmail = configService.get(
              'ADMIN_EMAIL',
              'admin@taskmanagement.com',
            );
            const adminPassword = configService.get(
              'ADMIN_PASSWORD',
              'admin123',
            );

            if (email === adminEmail && password === adminPassword) {
              return { email, title: 'Admin' };
            }
            return null;
          },
          cookieName: 'adminjs',
          cookiePassword:
            configService.get<string>('COOKIE_SECRET') ||
            'secret-key-change-in-production',
        },
        sessionOptions: {
          resave: false,
          saveUninitialized: true,
          secret:
            configService.get<string>('COOKIE_SECRET') ||
            'secret-key-change-in-production',
        },
      }),
    });
  } catch (error) {
    console.warn('AdminJS packages not found. Admin panel will be disabled.');
    console.warn(
      'To enable admin panel, run: npm install @adminjs/nestjs @adminjs/typeorm adminjs',
    );
    return null;
  }
};

const adminModule = createAdminModule();

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
        // <--- Wrap the object in an array
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

    // Conditionally include AdminJS module if available
    ...(adminModule ? [adminModule] : []),
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
    if (!adminModule) {
      console.log(
        'ℹ️  Admin panel is disabled. To enable it, install AdminJS packages:',
      );
      console.log('   npm install @adminjs/nestjs @adminjs/typeorm adminjs');
    } else {
      console.log('✅ Admin panel is available at /admin');
    }
  }
}

export default AppModule;
