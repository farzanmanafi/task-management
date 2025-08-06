import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './app/tasks/tasks.module';
import { ProjectsModule } from './app/projects/projects.module';
import { LabelsModule } from './app/labels/labels.module';
import { AuthModule } from './app/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from './shared/cache/cache.module';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    CacheModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    TasksModule,
    ProjectsModule,
    LabelsModule,
    AuthModule,
    // Conditionally include AdminJS module if available
    ...(adminModule ? [adminModule] : []),
  ],
  providers: [AppService],
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
