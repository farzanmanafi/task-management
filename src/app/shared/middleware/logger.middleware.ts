// src/shared/middleware/logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || '';
    const requestId = headers['x-request-id'];
    const correlationId = headers['x-correlation-id'];

    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const responseTime = Date.now() - startTime;

      const logMessage = `${method} ${originalUrl} ${statusCode} ${
        contentLength || 0
      } - ${responseTime}ms`;

      const logContext = {
        method,
        url: originalUrl,
        statusCode,
        contentLength,
        responseTime,
        ip,
        userAgent,
        requestId,
        correlationId,
      };

      if (statusCode >= 500) {
        this.logger.error(logMessage, JSON.stringify(logContext));
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, JSON.stringify(logContext));
      } else {
        this.logger.log(logMessage, JSON.stringify(logContext));
      }
    });

    next();
  }
}