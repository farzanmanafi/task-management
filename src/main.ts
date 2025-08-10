import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';
import { setupSwagger } from './config/swagger.config';
import { AppConfigService } from './config/config.service';
import { QueueService } from './queue/queue.service';
import helmet from 'helmet';
import compression from 'compression';

// Import bull board setup function
async function setupBullBoard(queueService: QueueService) {
  try {
    // Dynamic import to handle missing Bull Board packages
    const { createBullBoard } = await import('@bull-board/api');
    const { BullAdapter } = await import('@bull-board/api/bullAdapter');
    const { ExpressAdapter } = await import('@bull-board/express');

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    // Access queue instances properly
    const queues = {
      email: queueService.getEmailQueue(),
      notification: queueService.getNotificationQueue(),
    };

    const bullAdapters = Object.values(queues).map(
      (queue) => new BullAdapter(queue),
    );

    createBullBoard({
      queues: bullAdapters,
      serverAdapter: serverAdapter,
    });

    return serverAdapter;
  } catch (error) {
    console.warn(
      'Bull Board packages not found. Queue monitoring will be disabled.',
    );
    console.warn(
      'To enable queue monitoring, install: npm install @bull-board/api @bull-board/api/bullAdapter @bull-board/express',
    );
    return null;
  }
}

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

    // Setup Bull Board with error handling
    try {
      const queueService = app.get(QueueService); // Use class token instead of string
      if (queueService) {
        const bullBoardAdapter = await setupBullBoard(queueService);
        if (bullBoardAdapter) {
          app.use('/admin/queues', bullBoardAdapter.getRouter());
          logger.log('Queue monitoring available at /admin/queues');
        }
      }
    } catch (error) {
      logger.warn('Queue service not available or Bull Board setup failed');
    }

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
