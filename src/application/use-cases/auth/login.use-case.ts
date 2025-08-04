// src/application/use-cases/auth/login.use-case.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { AUTH_SERVICE } from 'src/domain/constants/tokens';
import type { AuthService } from 'src/domain/services/auth.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: AuthService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.authService.validateCredentials(
      dto.email,
      dto.password,
    );
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    return AuthResponseDto.create(accessToken, refreshToken);
  }
}
