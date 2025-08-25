// src/common/middleware/user-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestUserContext } from '../contexts/user-context.service';

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  constructor(private readonly userContext: RequestUserContext) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req['user']?.sub) {
      this.userContext.setUserId(req['user'].sub);
    }
    next();
  }
}
