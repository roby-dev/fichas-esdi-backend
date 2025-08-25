import { Session } from '../entities/session.entity';

export interface SessionRepository {
  save(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findAll(limit?: number, offset?: number): Promise<Session[]>;
  update(session: Session): Promise<Session>;
  findAllByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Session[]>;

  updateByTokenId(
    id: string,
    active: boolean | undefined,
    ipAddress: string | string[] | undefined,
    userAgent: string | undefined,
  ): Promise<Session | null>;
}
