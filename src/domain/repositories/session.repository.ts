import { Session } from '../entities/session.entity';

export interface SessionQueryFilter {
  userId?: string;
  active?: boolean;
}

export interface SessionPagination {
  limit?: number;
  offset?: number;
}

export interface SessionPage {
  items: Session[];
  total: number;
}

export interface UserSessionSummary {
  userId: string;
  email: string;
  roles: string[];
  isOnline: boolean;
  totalSessions: number;
  activeSessions: number;
  lastSeenAt: Date;
  lastIpAddress?: string;
  lastUserAgent?: string;
}

export interface UserSessionSummaryPage {
  items: UserSessionSummary[];
  total: number;
}

export interface SessionRepository {
  save(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findAll(limit?: number, offset?: number): Promise<SessionPage>;
  update(session: Session): Promise<Session>;
  findAllByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<SessionPage>;
  findMany(
    filter: SessionQueryFilter,
    pagination?: SessionPagination,
  ): Promise<SessionPage>;
  getSummaryByUser(
    pagination?: SessionPagination,
  ): Promise<UserSessionSummaryPage>;

  updateByTokenId(
    id: string,
    active: boolean | undefined,
    ipAddress: string | string[] | undefined,
    userAgent: string | undefined,
  ): Promise<Session | null>;
}

