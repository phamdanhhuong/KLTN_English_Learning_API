import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import {
  StandardApiResponse,
  ResponseBuilder,
} from '../interfaces/standard-response.interface';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, StandardApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<T>> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const { url, method } = request;

    return next.handle().pipe(
      map((data) => {
        const processingTime = Date.now() - startTime;

        // If data is already in standard format, just update processing time
        if (this.isStandardApiResponse(data)) {
          return {
            ...data,
            path: `${method} ${url}`,
            meta: {
              ...data.meta,
              processingTime,
            },
          };
        }

        // Transform to standard format
        return ResponseBuilder.success(
          data,
          'Success',
          response.statusCode,
          `${method} ${url}`,
          { processingTime },
        );
      }),
    );
  }

  private isStandardApiResponse(data: any): data is StandardApiResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.success === 'boolean' &&
      typeof data.statusCode === 'number' &&
      typeof data.message === 'string' &&
      data.hasOwnProperty('data') &&
      typeof data.timestamp === 'string'
    );
  }
}
