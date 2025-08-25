import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthService } from 'src/domain/services/auth.service';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { AUTH_SERVICE, SESSION_REPOSITORY } from 'src/domain/constants/tokens';
import { v7 as uuidv7 } from 'uuid';
import { RequestInfoContext } from 'src/common/contexts/request-info.context';
import { Session } from 'src/domain/entities/session.entity';
import type { SessionRepository } from 'src/domain/repositories/session.repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    refreshToken: string,
    infoContext: RequestInfoContext,
  ): Promise<AuthResponseDto> {
    const user = await this.authService.validateRefreshToken(refreshToken);
    if (!user) throw new UnauthorizedException('Refresh token inválido');

    const jti = uuidv7();
    const newAccessToken = this.authService.generateAccessToken(user, jti);
    const newRefreshToken = this.authService.generateRefreshToken(user);

    const session = Session.create(
      user.id,
      jti,
      infoContext.getIpAddress(),
      infoContext.getUserAgent(),
    );

    const sessionCreated = await this.sessionRepository.save(session);

    return AuthResponseDto.create(newAccessToken, newRefreshToken);
  }
}
