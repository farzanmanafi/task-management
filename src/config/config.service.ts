// src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  // Environment
  get environment(): string {
    return this.configService.get('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  get isTest(): boolean {
    return this.environment === 'test';
  }

  get port(): number {
    return this.configService.get('PORT', 3000);
  }

  // Database
  get databaseConfig() {
    return {
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_DATABASE'),
      synchronize: this.configService.get('DB_SYNCHRONIZE'),
      logging: this.configService.get('DB_LOGGING'),
      connectionTimeout: this.configService.get('DB_CONNECTION_TIMEOUT'),
      maxConnections: this.configService.get('DB_MAX_CONNECTIONS'),
    };
  }

  // JWT
  get jwtConfig() {
    return {
      accessSecret: this.configService.get('JWT_ACCESS_SECRET'),
      refreshSecret: this.configService.get('JWT_REFRESH_SECRET'),
      accessExpiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      refreshExpiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    };
  }

  // Redis
  get redisConfig() {
    return {
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB'),
    };
  }

  // Email
  get emailConfig() {
    return {
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      user: this.configService.get('SMTP_USER'),
      password: this.configService.get('SMTP_PASSWORD'),
      from: this.configService.get('SMTP_FROM'),
      secure: this.configService.get('SMTP_SECURE'),
    };
  }

  // Upload
  get uploadConfig() {
    return {
      destination: this.configService.get('UPLOAD_DESTINATION'),
      maxFileSize: this.configService.get('MAX_FILE_SIZE'),
      allowedFileTypes: this.configService.get('ALLOWED_FILE_TYPES'),
    };
  }

  // Security
  get securityConfig() {
    return {
      corsOrigin: this.configService.get('CORS_ORIGIN'),
      cookieSecret: this.configService.get('COOKIE_SECRET'),
      helmetEnabled: this.configService.get('HELMET_ENABLED'),
      rateLimitTtl: this.configService.get('RATE_LIMIT_TTL'),
      rateLimitLimit: this.configService.get('RATE_LIMIT_LIMIT'),
    };
  }

  // Feature flags
  get featureFlags() {
    return {
      emailVerification: this.configService.get('FEATURE_EMAIL_VERIFICATION'),
      fileUpload: this.configService.get('FEATURE_FILE_UPLOAD'),
      notifications: this.configService.get('FEATURE_NOTIFICATIONS'),
      analytics: this.configService.get('FEATURE_ANALYTICS'),
    };
  }

  // Logging
  get loggingConfig() {
    return {
      level: this.configService.get('LOG_LEVEL'),
      toFile: this.configService.get('LOG_TO_FILE'),
      filePath: this.configService.get('LOG_FILE_PATH'),
    };
  }

  // Helper methods
  isFeatureEnabled(feature: string): boolean {
    return this.featureFlags[feature] === true;
  }

  getConnectionString(): string {
    const db = this.databaseConfig;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`;
  }

  getRedisConnectionString(): string {
    const redis = this.redisConfig;
    const auth = redis.password ? `:${redis.password}@` : '';
    return `redis://${auth}${redis.host}:${redis.port}/${redis.db}`;
  }
}
