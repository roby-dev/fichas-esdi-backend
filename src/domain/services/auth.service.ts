import { AuthUser } from '../entities/auth-user.entity';

export interface AuthService {
  validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthUser | null>;
  generateAccessToken(user: AuthUser): string;
  generateRefreshToken(user: AuthUser): string;
  validateRefreshToken(token: string): Promise<AuthUser | null>;
}
