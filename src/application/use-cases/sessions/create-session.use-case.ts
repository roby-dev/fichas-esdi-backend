import { Inject, Injectable } from '@nestjs/common';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { SESSION_REPOSITORY } from 'src/domain/constants/tokens';
import type { SessionRepository } from 'src/domain/repositories/session.repository';

@Injectable()
export class CreateSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly userContext: RequestUserContext,
  ) {}



}
