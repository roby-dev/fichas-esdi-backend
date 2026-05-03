import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SESSION_REPOSITORY, USER_REPOSITORY } from 'src/domain/constants/tokens';
import { PASSWORD_RESET_BY_ADMIN } from 'src/domain/constants/audit-actions';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import type { SessionRepository } from 'src/domain/repositories/session.repository';
import { AuditService } from './audit.service';

const BCRYPT_COST = 12;

@Injectable()
export class AdminUserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: SessionRepository,
    private readonly auditService: AuditService,
  ) {}

  async resetPassword(
    targetUserId: string,
    temporaryPassword: string,
  ): Promise<{ ok: true }> {
    const user = await this.userRepo.findById(targetUserId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const newHash = await bcrypt.hash(temporaryPassword, BCRYPT_COST);

    await this.userRepo.updatePassword(targetUserId, newHash, true);

    const sessionsKilled = await this.sessionRepo.deactivateAllByUserId(
      targetUserId,
    );

    await this.auditService.record({
      action: PASSWORD_RESET_BY_ADMIN,
      entityType: 'user',
      entityId: targetUserId,
      // NOTE: raw temporaryPassword is intentionally NEVER included here
      before: {
        passwordHash: '[OLD]',
        mustChangePassword: user.mustChangePassword,
      },
      after: { passwordHash: '[NEW]', mustChangePassword: true },
      metadata: {
        forcedChangeOnNextLogin: true,
        sessionsKilled,
      },
    });

    return { ok: true };
  }
}
