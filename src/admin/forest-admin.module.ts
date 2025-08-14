// src/admin/forest-admin.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForestAdminService } from './forest-admin.service';

@Module({
  providers: [ForestAdminService],
  exports: [ForestAdminService],
})
export class ForestAdminModule implements OnModuleInit {
  constructor(
    private forestAdminService: ForestAdminService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') !== 'production') {
      await this.forestAdminService.initialize();
    }
  }
}
