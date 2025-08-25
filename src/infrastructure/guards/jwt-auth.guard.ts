// src/infra/http/guards/jwt-auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { RequestUserContext } from 'src/common/contexts/user-context.service';

@Injectable({ scope: Scope.REQUEST })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
    private readonly userContext: RequestUserContext,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const token = this.extractTokenFromHeader(this.request);
    if (!token) throw new UnauthorizedException('Token no proporcionado');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      this.request['user'] = payload;
      this.userContext.setUserId(payload.sub);
      this.userContext.setTokenId(payload.jti);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
