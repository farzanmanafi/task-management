import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { setupSwagger } from './config/swagger.config';
import { AppConfigService } from './config/config.service';
import helmet from 'helmet';
import compression from 'compression';

import { setupBullBoard } from './queue/bull-board.setup';
import { QueueService } from './queue/queue.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn', 'log']
          : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const appConfigService = app.get(AppConfigService);

    const queueService = app.get(QueueService);
    const bullBoardAdapter = setupBullBoard({
      email: queueService.emailQueue,
      notification: queueService.notificationQueue,
      // ... other queues
    });

    app.use('/admin/queues', bullBoardAdapter.getRouter());

    // Security middleware
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        },
      }),
    );

    // Compression middleware
    app.use(compression());

    // CORS configuration
    app.enableCors({
      origin: appConfigService.securityConfig.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
      ],
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        dismissDefaultMessages: false,
        validationError: {
          target: false,
          value: false,
        },
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global response interceptor
    app.useGlobalInterceptors(new ResponseInterceptor());

    // API prefix
    app.setGlobalPrefix('api/v1');

    // Setup Swagger documentation
    if (!appConfigService.isProduction) {
      setupSwagger(app, appConfigService);
      logger.log('Swagger documentation available at /api/docs');
    }

    // Start the application
    const port = appConfigService.port;
    await app.listen(port);

    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Environment: ${appConfigService.environment}`);

    if (!appConfigService.isProduction) {
      logger.log(`API Documentation: http://localhost:${port}/api/docs`);
    }
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
