import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/domain/services/auth.service';
import { AuthUser } from 'src/domain/entities/auth-user.entity';
import { USER_REPOSITORY } from 'src/domain/constants/tokens';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtAuthService implements AuthService {
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {
    this.jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN', '1h');
    this.jwtRefreshExpiresIn = this.configService.get(
      'JWT_REFRESH_EXPIRES_IN',
      '1d',
    );
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return null;

    return new AuthUser(user.id!, user.email, user.roles);
  }

  generateAccessToken(user: AuthUser, jti: string): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, roles: user.roles, jti: jti },
      { expiresIn: this.jwtExpiresIn },
    );
  }

  generateRefreshToken(user: AuthUser): string {
    return this.jwtService.sign(
      { sub: user.id },
      { expiresIn: this.jwtRefreshExpiresIn },
    );
  }

  async validateRefreshToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const user = await this.userRepo.findById(payload.sub);
      if (!user) return null;

      return new AuthUser(user.id!, user.email, user.roles);
    } catch {
      return null;
    }
  }
}
