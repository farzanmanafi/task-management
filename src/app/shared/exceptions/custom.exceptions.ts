// src/shared/exceptions/custom.exceptions.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessLogicException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, statusCode);
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super(message, HttpStatus.CONFLICT);
  }
}

export class InvalidOperationException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class ForbiddenOperationException extends HttpException {
  constructor(
    message: string = 'You do not have permission to perform this operation',
  ) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedOperationException extends HttpException {
  constructor(
    message: string = 'You must be authenticated to perform this operation',
  ) {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ValidationException extends HttpException {
  constructor(errors: string[]) {
    super(
      {
        message: 'Validation failed',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ExternalServiceException extends HttpException {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class RateLimitException extends HttpException {
  constructor(message: string = 'Too many requests') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class MaintenanceException extends HttpException {
  constructor(message: string = 'Service is under maintenance') {
    super(message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
