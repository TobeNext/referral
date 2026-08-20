import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { REQUEST_ID, RequestWithId } from './request-id.middleware';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithId>();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = exception instanceof HttpException ? exception.getResponse() : undefined;
    const objectPayload = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const code =
      typeof objectPayload.code === 'string'
        ? objectPayload.code
        : status === 400
          ? 'VALIDATION_FAILED'
          : status === 404
            ? 'NOT_FOUND'
            : 'INTERNAL_ERROR';
    const rawMessage = objectPayload.message ?? (exception instanceof HttpException ? exception.message : '服务暂时不可用');
    const message = Array.isArray(rawMessage)
      ? rawMessage.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))).join('; ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : JSON.stringify(rawMessage);
    if (status >= 500)
      this.logger.error(
        JSON.stringify({
          event: 'http.request.failed',
          requestId: request[REQUEST_ID],
          path: request.originalUrl,
          code,
          errorType: exception instanceof Error ? exception.name : 'UnknownError'
        })
      );
    response.status(status).json({
      statusCode: status,
      code,
      message,
      requestId: request[REQUEST_ID],
      timestamp: new Date().toISOString(),
      path: request.originalUrl
    });
  }
}
