import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SESSION_REPOSITORY, USER_REPOSITORY } from 'src/domain/constants/tokens';
import {
  PASSWORD_CHANGED,
  PASSWORD_FORCED_CHANGE,
} from 'src/domain/constants/audit-actions';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import type { SessionRepository } from 'src/domain/repositories/session.repository';
import { AuditService } from 'src/application/services/audit.service';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { ChangePasswordDto } from 'src/application/dtos/auth/change-password.dto';
import { ChangePasswordResponseDto } from 'src/application/dtos/auth/change-password-response.dto';

const BCRYPT_COST = 12;

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: SessionRepository,
    private readonly auditService: AuditService,
    private readonly userContext: RequestUserContext,
  ) {}

  async execute(
    dto: ChangePasswordDto,
    currentJti: string,
  ): Promise<ChangePasswordResponseDto> {
    const userId = this.userContext.getUserId();

    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Contraseña actual inválida');
    }

    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException('SAME_PASSWORD');
    }

    const wasFlagged = user.mustChangePassword;
    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);

    await this.userRepo.updatePassword(user.id!, newHash, false);

    if (wasFlagged) {
      // Forced-change completion: kill ALL sessions including the current one
      const sessionsKilled = await this.sessionRepo.deactivateAllByUserId(
        user.id!,
      );

      await this.auditService.record({
        action: PASSWORD_FORCED_CHANGE,
        entityType: 'user',
        entityId: user.id!,
        before: { passwordHash: '[OLD]', mustChangePassword: true },
        after: { passwordHash: '[NEW]', mustChangePassword: false },
        metadata: {
          triggeredBy: 'admin_reset',
          sessionsInvalidated: sessionsKilled,
        },
      });

      const response = new ChangePasswordResponseDto();
      response.mustReauthenticate = true;
      return response;
    } else {
      // Self-service change: keep current session, kill all others
      const sessionsKilled = await this.sessionRepo.deactivateAllByUserIdExcept(
        user.id!,
        currentJti,
      );

      await this.auditService.record({
        action: PASSWORD_CHANGED,
        entityType: 'user',
        entityId: user.id!,
        before: { passwordHash: '[OLD]', mustChangePassword: false },
        after: { passwordHash: '[NEW]', mustChangePassword: false },
        metadata: { sessionsInvalidated: sessionsKilled },
      });

      const response = new ChangePasswordResponseDto();
      response.ok = true;
      return response;
    }
  }
}
