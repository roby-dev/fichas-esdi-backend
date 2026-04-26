import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from 'src/domain/exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocurrió un error inesperado. Intenta más tarde.';
    let error = 'Internal Server Error';

    if (exception instanceof DomainException) {
      if (exception.name === 'NotFoundException') status = HttpStatus.NOT_FOUND;
      else if (exception.name === 'ConflictException') status = HttpStatus.CONFLICT;
      else if (exception.name === 'UnauthorizedException') status = HttpStatus.UNAUTHORIZED;
      else if (exception.name === 'BadRequestException') status = HttpStatus.BAD_REQUEST;
      else status = HttpStatus.BAD_REQUEST;

      message = exception.message;
      error = exception.name;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as Record<string, any>;
        message = res.message ?? message;
        error = res.error ?? exception.name;

        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
