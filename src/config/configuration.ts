// src/config/configuration.ts
import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  validateSync,
} from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 3000;

  // Database Configuration
  @IsString()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_PORT: number = 5432;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_SYNCHRONIZE: boolean = false;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  DB_LOGGING: boolean = false;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_CONNECTION_TIMEOUT: number = 30000;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DB_MAX_CONNECTIONS: number = 10;

  // JWT Configuration
  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // Redis Configuration
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  REDIS_DB: number = 0;

  // Email Configuration
  @IsString()
  SMTP_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  SMTP_PORT: number = 587;

  @IsString()
  SMTP_USER: string;

  @IsString()
  SMTP_PASSWORD: string;

  @IsString()
  SMTP_FROM: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  SMTP_SECURE: boolean = false;

  // File Upload Configuration
  @IsString()
  UPLOAD_DESTINATION: string = './uploads';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  MAX_FILE_SIZE: number = 10 * 1024 * 1024; // 10MB

  @IsString()
  ALLOWED_FILE_TYPES: string =
    'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  // Rate Limiting
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  RATE_LIMIT_LIMIT: number = 100;

  // Logging Configuration
  @IsEnum(['error', 'warn', 'info', 'debug', 'verbose'])
  LOG_LEVEL: string = 'info';

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  LOG_TO_FILE: boolean = false;

  @IsString()
  LOG_FILE_PATH: string = './logs';

  // Security Configuration
  @IsString()
  CORS_ORIGIN: string = '*';

  @IsString()
  COOKIE_SECRET: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  HELMET_ENABLED: boolean = true;

  // Admin Configuration
  @IsOptional()
  @IsString()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;

  // External Services
  @IsOptional()
  @IsString()
  AWS_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  AWS_SECRET_ACCESS_KEY?: string;

  @IsOptional()
  @IsString()
  AWS_REGION?: string;

  @IsOptional()
  @IsString()
  AWS_S3_BUCKET?: string;

  // Feature Flags
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  FEATURE_EMAIL_VERIFICATION: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  FEATURE_FILE_UPLOAD: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  FEATURE_NOTIFICATIONS: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  FEATURE_ANALYTICS: boolean = false;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}

// Individual configuration namespaces
export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 30000,
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 10,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  retryAttempts: 3,
  retryDelay: 1000,
}));

export const emailConfig = registerAs('email', () => ({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  from: process.env.SMTP_FROM,
  secure: process.env.SMTP_SECURE === 'true',
}));

export const uploadConfig = registerAs('upload', () => ({
  destination: process.env.UPLOAD_DESTINATION || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/*',
    'application/pdf',
  ],
}));

export const securityConfig = registerAs('security', () => ({
  corsOrigin: process.env.CORS_ORIGIN || '*',
  cookieSecret: process.env.COOKIE_SECRET,
  helmetEnabled: process.env.HELMET_ENABLED === 'true',
  rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
  rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT, 10) || 100,
}));

export const loggingConfig = registerAs('logging', () => ({
  level: process.env.LOG_LEVEL || 'info',
  toFile: process.env.LOG_TO_FILE === 'true',
  filePath: process.env.LOG_FILE_PATH || './logs',
}));

export const featureConfig = registerAs('features', () => ({
  emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
  fileUpload: process.env.FEATURE_FILE_UPLOAD === 'true',
  notifications: process.env.FEATURE_NOTIFICATIONS === 'true',
  analytics: process.env.FEATURE_ANALYTICS === 'true',
}));
