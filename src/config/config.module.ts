// src/config/config.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  validate,
  databaseConfig,
  jwtConfig,
  redisConfig,
  emailConfig,
  uploadConfig,
  securityConfig,
  loggingConfig,
  featureConfig,
} from './configuration';
import { AppConfigService } from './config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate,
      load: [
        databaseConfig,
        jwtConfig,
        redisConfig,
        emailConfig,
        uploadConfig,
        securityConfig,
        loggingConfig,
        featureConfig,
      ],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService, ConfigModule],
})
export class AppConfigModule {}
