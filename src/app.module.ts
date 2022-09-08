import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { TasksModule } from './app/tasks/tasks.module';
import { ProjectsModule } from './app/projects/projects.module';
import { LabelsModule } from './app/labels/labels.module';
import { AuthModule } from './app/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AdminModule } from '@adminjs/nestjs';
import { Database, Resource } from '@adminjs/typeorm';

import * as bcrypt from 'bcrypt';

import AdminJs from 'adminjs';
import { adminJSOptions } from './app/admin-pannel/admin-panel.plugin';
import { User } from './app/auth/entities/user.entity';

AdminJs.registerAdapter({ Database, Resource });

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        name: 'default',
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: ['dist/**/*.entity{ .ts,.js}'],
        synchronize: false,
        migrations: ['dist/db/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        migrationsRun: false,
        cli: {
          migrationsDir: 'src/db/migrations',
        },
      }),
      inject: [ConfigService],
    }),
    TasksModule,
    ProjectsModule,
    LabelsModule,
    AuthModule,
    AdminModule.createAdminAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): any => ({
        adminJsOptions: adminJSOptions,
        auth: {
          cookieName: configService.get<string>('ADMIN_EMAIL'),
          cookiePassword: configService.get<string>('ADMIN_PASSWORD'),
          authenticate: async (email, password) => {
            const user = await User.findOne({
              where: { email },
            });
            if (!user) {
              return false;
            }
            const isValidPass = await bcrypt.compare(password, user.password);
            if (user.role === 'ADMIN' && isValidPass) {
              return Promise.resolve({ email });
            }
            return false;
          },
        },
        predefinedRouter: null,
        sessionOptions: {
          resave: false,
          saveUninitialized: true,
        },
      }),
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
