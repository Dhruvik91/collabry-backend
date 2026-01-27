import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class SuccessResponseTransformer implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();

    return next.handle().pipe(
      map((responseData) => {
        // Extract pagination data if it exists
        const metaData: any = {};
        let data = responseData;

        // Check if response has pagination metadata
        if (responseData && typeof responseData === 'object') {
          if ('data' in responseData && 'pagination' in responseData) {
            // If the response already has data and pagination separated
            data = responseData.data;
            metaData.pagination = responseData.pagination;
          } else if ('items' in responseData && 'meta' in responseData) {
            // TypeORM pagination format
            data = responseData.items;
            metaData.pagination = responseData.meta;
          } else if ('total' in responseData || 'page' in responseData) {
            // If pagination fields are mixed with data
            const { total, page, limit, totalPages, ...actualData } = responseData;
            if (total !== undefined || page !== undefined) {
              data = actualData;
              metaData.pagination = { total, page, limit, totalPages };
            }
          }
        }

        return {
          data,
          metaData,
          message: [],
          error: null,
          statusCode: response.statusCode ?? 200,
          isError: false,
        };
      }),
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }
}
