import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { adminJSOptions } from './admin-panel.plugin';

// Dynamic import to handle potential module resolution issues
const createAdminModule = () => {
  try {
    const { AdminModule } = require('@adminjs/nestjs');
    const AdminJS = require('adminjs');
    const { Database, Resource } = require('@adminjs/typeorm');

    // Register the adapter
    AdminJS.registerAdapter({ Database, Resource });

    return AdminModule.createAdminAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        adminJsOptions: {
          ...adminJSOptions,
          rootPath: '/admin',
        },
        auth: {
          authenticate: async (email: string, password: string) => {
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
    console.warn('AdminJS not available:', error.message);
    return null;
  }
};

@Module({})
export class AdminPannelModule {
  static forRootAsync() {
    return createAdminModule();
  }
}
