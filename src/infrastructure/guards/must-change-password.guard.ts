import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Scope,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ALLOW_MUST_CHANGE_PASSWORD } from './allow-when-must-change-password.decorator';

// REQUEST-scoped to match AuthGuard. When APP_GUARDs have mixed scopes,
// NestJS runs singletons before request-scoped ones, breaking registration
// order. Same scope keeps the order deterministic: AuthGuard runs first,
// populates req.user, THEN this guard reads it.
@Injectable({ scope: Scope.REQUEST })
export class MustChangePasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<boolean>(
      ALLOW_MUST_CHANGE_PASSWORD,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (allowed) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req['user'] as { mustChangePassword?: boolean } | undefined;

    // Short-circuit on public routes: AuthGuard skipped them via @Public(),
    // so req.user is undefined and there is nothing to enforce here.
    if (!user) return true;

    if (user.mustChangePassword) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MUST_CHANGE_PASSWORD',
        message: 'Debes cambiar tu contraseña antes de continuar',
      });
    }

    return true;
  }
}
