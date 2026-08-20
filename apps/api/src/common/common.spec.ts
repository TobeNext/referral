import { ArgumentsHost, ExecutionContext, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { lastValueFrom, of, throwError } from 'rxjs';
import { ApiExceptionFilter } from './api-exception.filter';
import { REQUEST_ID, RequestIdMiddleware, RequestWithId } from './request-id.middleware';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

describe('HTTP common components', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps a bounded incoming request id and generates one for invalid input', () => {
    const middleware = new RequestIdMiddleware();
    for (const [header, expected] of [
      [' request-123 ', 'request-123'],
      ['x'.repeat(129), undefined]
    ] as const) {
      const request = { header: jest.fn().mockReturnValue(header) } as unknown as RequestWithId;
      const setHeader = jest.fn();
      const response = { setHeader } as unknown as Response;
      const next = jest.fn();
      middleware.use(request, response, next);
      expect(request[REQUEST_ID]).toEqual(expected ?? expect.stringMatching(/^[0-9a-f-]{36}$/));
      expect(setHeader).toHaveBeenCalledWith('X-Request-Id', request[REQUEST_ID]);
      expect(next).toHaveBeenCalledTimes(1);
    }
  });

  it.each([
    [new HttpException({ code: 'CUSTOM', message: ['first', { field: 'second' }] }, 422), 422, 'CUSTOM', 'first; {"field":"second"}'],
    [new HttpException('missing', 404), 404, 'NOT_FOUND', 'missing'],
    [new Error('database detail'), 500, 'INTERNAL_ERROR', '服务暂时不可用']
  ])('normalizes API exceptions without leaking internal errors', (exception, status, code, message) => {
    const json = jest.fn();
    const response = { status: jest.fn().mockReturnValue({ json }) };
    const request = { originalUrl: '/api/test', [REQUEST_ID]: 'req-1' };
    const host = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    } as unknown as ArgumentsHost;
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    new ApiExceptionFilter().catch(exception, host);
    expect(response.status).toHaveBeenCalledWith(status);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: status, code, message, requestId: 'req-1', path: '/api/test' })
    );
    expect(errorSpy).toHaveBeenCalledTimes(status >= 500 ? 1 : 0);
  });

  it('logs successful and failed requests with their final status', async () => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValue(125);
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const request = { method: 'GET', originalUrl: '/api/health', [REQUEST_ID]: 'req-2' } as RequestWithId;
    const response = { statusCode: 200 } as Response;
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    } as unknown as ExecutionContext;
    const interceptor = new RequestLoggingInterceptor();

    await lastValueFrom(interceptor.intercept(context, { handle: () => of('ok') }));
    await expect(
      lastValueFrom(interceptor.intercept(context, { handle: () => throwError(() => new HttpException('no', 403)) }))
    ).rejects.toThrow();
    expect(JSON.parse(String(log.mock.calls[0][0]))).toEqual(expect.objectContaining({ statusCode: 200, durationMs: 25 }));
    expect(JSON.parse(String(log.mock.calls[1][0]))).toEqual(expect.objectContaining({ statusCode: 403 }));
  });
});
