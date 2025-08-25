import { Injectable, Scope, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestInfoContext } from 'src/common/contexts/request-info.context';

@Injectable({ scope: Scope.REQUEST })
export class RequestInfoMiddleware implements NestMiddleware {
  constructor(private readonly requestInfo: RequestInfoContext) {}

  use(req: Request, res: Response, next: NextFunction) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.ip ||
      req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];

    this.requestInfo.setIpAddress(ip);
    this.requestInfo.setUserAgent(userAgent);

    req['requestInfo'] = this.requestInfo;
    next();
  }
}
