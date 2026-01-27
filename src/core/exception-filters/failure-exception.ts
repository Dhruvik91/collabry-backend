import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorData = {
  message: string | string[];
  error: string;
  statusCode: number;
};

@Catch(HttpException)
export class FailureResponseTransformer implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): Record<string, any> {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const errorData: ErrorData = exception.getResponse() as ErrorData;
    const messageArray =
      typeof errorData.message === 'string'
        ? [errorData.message]
        : errorData.message;

    const result = {
      data: null,
      message: messageArray,
      error: errorData.error,
      statusCode: status,
      isError: true,
    };

    return response.status(status).json(result);
  }
}
