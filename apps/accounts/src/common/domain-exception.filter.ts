import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AccountNotFoundError } from '../accounts/accounts.errors';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AccountNotFoundError) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'ACCOUNT_NOT_FOUND',
        message: exception.message,
      });
    }

    // Let Nest handle known HttpExceptions
    if (
      exception instanceof HttpException &&
      exception?.getStatus &&
      exception?.getResponse
    ) {
      const status = exception.getStatus();
      return res.status(status).json(exception.getResponse());
    }

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected error',
    });
  }
}
