import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ValidationError } from 'class-validator';

interface ErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  errors?: string[];
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log the error
    this.logError(exception, request, errorResponse);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | undefined;
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;
        error = responseObj.error;
        errors =
          responseObj.message instanceof Array
            ? responseObj.message
            : undefined;
      }
    } else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = this.handleDatabaseError(exception);
    } else if (exception instanceof ValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errors = this.formatValidationErrors([exception]);
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    return {
      success: false,
      message,
      error,
      errors,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
    };
  }

  private handleDatabaseError(error: QueryFailedError): string {
    const message = error.message;
    const code = (error as any).code;

    switch (code) {
      case '23505': // unique_violation
        return 'Duplicate entry. Resource already exists';
      case '23503': // foreign_key_violation
        return 'Referenced resource does not exist';
      case '23502': // not_null_violation
        return 'Required field is missing';
      case '23514': // check_violation
        return 'Invalid data provided';
      case '42703': // undefined_column
        return 'Invalid field specified';
      default:
        return `Database error: ${message}`;
    }
  }

  private formatValidationErrors(errors: ValidationError[]): string[] {
    const formattedErrors: string[] = [];

    errors.forEach((error) => {
      if (error.constraints) {
        Object.values(error.constraints).forEach((constraint) => {
          formattedErrors.push(constraint);
        });
      }

      if (error.children && error.children.length > 0) {
        formattedErrors.push(...this.formatValidationErrors(error.children));
      }
    });

    return formattedErrors;
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ) {
    const { method, url, body, query, params, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || request.ip;

    const logContext = {
      method,
      url,
      body: this.sanitizeLogData(body),
      query,
      params,
      userAgent,
      ip,
      statusCode: errorResponse.statusCode,
      requestId: errorResponse.requestId,
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `${method} ${url} - ${errorResponse.message}`,
        JSON.stringify(logContext),
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `${method} ${url} - ${errorResponse.message}`,
        JSON.stringify(logContext),
      );
    }
  }

  private sanitizeLogData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }
}
