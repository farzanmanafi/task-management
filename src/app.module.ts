import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksModule } from './app/tasks/tasks.module';
import { ProjectsModule } from './app/projects/projects.module';
import { LabelsModule } from './app/labels/labels.module';
import { AuthModule } from './app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';

import * as bcrypt from 'bcrypt';

import { User } from './app/auth/entities/user.entity';
import { getDatabaseConfig } from './config/database.config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from './shared/cache/cache.module';
import { AppService } from './app.service';

import { AdminModule } from '@adminjs/nestjs';
import AdminJS from 'adminjs';
import { Database, Resource } from '@adminjs/typeorm';
import { adminJSOptions } from './app/admin-pannel/admin-panel.plugin';

// Register the adapter
AdminJS.registerAdapter({ Database, Resource });

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
    AdminModule.createAdminAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        adminJsOptions: adminJSOptions,
        auth: {
          cookieName: 'adminjs',
          cookiePassword:
            configService.get<string>('COOKIE_SECRET') ||
            'some-secret-password',
          authenticate: async (email: string, password: string) => {
            try {
              const user = await User.findOne({ where: { email } });
              if (!user) return null;

              const isValidPassword = await bcrypt.compare(
                password,
                user.password,
              );
              if (isValidPassword && user.role === 'admin') {
                return {
                  email: user.email,
                  title: user.fullName,
                  role: user.role,
                };
              }
              return null;
            } catch (error) {
              console.error('Admin auth error:', error);
              return null;
            }
          },
        },
        sessionOptions: {
          resave: false,
          saveUninitialized: true,
          secret:
            configService.get<string>('COOKIE_SECRET') ||
            'some-secret-password',
        },
      }),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
