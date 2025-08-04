import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthService } from 'src/domain/services/auth.service';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { AUTH_SERVICE } from 'src/domain/constants/tokens';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthService,
  ) {}

  async execute(refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.authService.validateRefreshToken(refreshToken);
    if (!user) throw new UnauthorizedException('Refresh token inválido');

    const newAccessToken = this.authService.generateAccessToken(user);
    const newRefreshToken = this.authService.generateRefreshToken(user);

    return AuthResponseDto.create(newAccessToken, newRefreshToken);
  }
}
