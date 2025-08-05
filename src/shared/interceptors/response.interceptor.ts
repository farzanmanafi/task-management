import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: any;
  timestamp: string;
  statusCode: number;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        // If the response is already formatted, return it as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Format the response
        return {
          success: true,
          message: this.getSuccessMessage(statusCode),
          data,
          timestamp: new Date().toISOString(),
          statusCode,
        };
      }),
    );
  }

  private getSuccessMessage(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.OK:
        return 'Request successful';
      case HttpStatus.CREATED:
        return 'Resource created successfully';
      case HttpStatus.ACCEPTED:
        return 'Request accepted';
      case HttpStatus.NO_CONTENT:
        return 'Request completed successfully';
      default:
        return 'Request successful';
    }
  }
}
