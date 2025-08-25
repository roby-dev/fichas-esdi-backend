// src/application/use-cases/auth/login.use-case.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { SESSION_REPOSITORY } from 'src/domain/constants/tokens';
import type { SessionRepository } from 'src/domain/repositories/session.repository';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    tokenId: string,
    ipAddress: string | string[] | undefined,
    userAgent: string | undefined,
  ): Promise<{ status: boolean; message: string }> {
    const session = await this.sessionRepository.updateByTokenId(
      tokenId,
      false,
      ipAddress,
      userAgent,
    );

    return {
      status: !!session,
      message: session
        ? 'Sesión cerrada con éxito'
        : 'No se pudo cerrar la sesión',
    };
  }
}
