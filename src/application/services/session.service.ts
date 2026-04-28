import { Inject, Injectable } from '@nestjs/common';
import { SESSION_REPOSITORY } from 'src/domain/constants/tokens';
import type {
  SessionPage,
  SessionPagination,
  SessionQueryFilter,
  SessionRepository,
  UserSessionSummaryPage,
} from 'src/domain/repositories/session.repository';

@Injectable()
export class SessionService {
  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
  ) {}

  query(
    filter: SessionQueryFilter,
    pagination?: SessionPagination,
  ): Promise<SessionPage> {
    return this.sessionRepository.findMany(filter, pagination);
  }

  getSummaryByUser(
    pagination?: SessionPagination,
  ): Promise<UserSessionSummaryPage> {
    return this.sessionRepository.getSummaryByUser(pagination);
  }
}

