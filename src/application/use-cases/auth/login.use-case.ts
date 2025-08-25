// src/application/use-cases/auth/login.use-case.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { RequestInfoContext } from 'src/common/contexts/request-info.context';
import { AUTH_SERVICE, SESSION_REPOSITORY } from 'src/domain/constants/tokens';
import { Session } from 'src/domain/entities/session.entity';
import type { SessionRepository } from 'src/domain/repositories/session.repository';
import type { AuthService } from 'src/domain/services/auth.service';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(dto: LoginDto, infoContext : RequestInfoContext): Promise<AuthResponseDto> {
    const user = await this.authService.validateCredentials(
      dto.email,
      dto.password,
    );
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const jti = uuidv7();
    const accessToken = this.authService.generateAccessToken(user, jti);
    const refreshToken = this.authService.generateRefreshToken(user);

    const session = Session.create(user.id, jti, infoContext.getIpAddress(), infoContext.getUserAgent());
    const sessionCreated = await this.sessionRepository.save(session);

    return AuthResponseDto.create(accessToken, refreshToken);
  }
}
