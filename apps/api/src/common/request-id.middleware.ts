import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export const REQUEST_ID = Symbol('requestId');
export type RequestWithId = Request & { [REQUEST_ID]?: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming = req.header('x-request-id')?.trim();
    const requestId = incoming && incoming.length <= 128 ? incoming : randomUUID();
    req[REQUEST_ID] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
