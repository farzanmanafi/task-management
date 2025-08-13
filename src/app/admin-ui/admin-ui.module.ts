// src/app/admin-ui/admin-ui.module.ts
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AdminModule } from '../admin-pannel/admin.module';
import { AdminApiController } from './admin-api.controller';

@Module({
  imports: [
    // Serve static files for the admin UI
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'admin-ui'),
      serveRoot: '/admin-ui',
      exclude: ['/api*'],
    }),
    AdminModule,
  ],
  controllers: [AdminApiController],
})
export class AdminUIModule {}
