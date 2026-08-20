import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { REQUEST_ID, RequestWithId } from './request-id.middleware';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HttpRequest');
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.log(request, response, startedAt),
        error: (error: unknown) => this.log(request, response, startedAt, error instanceof HttpException ? error.getStatus() : 500)
      })
    );
  }
  private log(request: RequestWithId, response: Response, startedAt: number, errorStatus?: number): void {
    this.logger.log(
      JSON.stringify({
        event: 'http.request.completed',
        requestId: request[REQUEST_ID],
        method: request.method,
        path: request.originalUrl,
        statusCode: errorStatus ?? response.statusCode,
        durationMs: Date.now() - startedAt
      })
    );
  }
}
