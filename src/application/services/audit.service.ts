import { Inject, Injectable } from '@nestjs/common';
import { RequestInfoContext } from 'src/common/contexts/request-info.context';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { AUDIT_EVENT_REPOSITORY } from 'src/domain/constants/tokens';
import {
  AuditEvent,
  AuditEventSnapshot,
} from 'src/domain/entities/audit-event.entity';
import type {
  AuditEventPage,
  AuditEventPagination,
  AuditEventQueryFilter,
  AuditEventRepository,
} from 'src/domain/repositories/audit-event.repository';

export interface AuditRecordInput {
  action: string;
  entityType: string;
  entityId: string;
  before: AuditEventSnapshot;
  after: AuditEventSnapshot;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_EVENT_REPOSITORY)
    private readonly auditEventRepository: AuditEventRepository,
    private readonly userContext: RequestUserContext,
    private readonly requestInfo: RequestInfoContext,
  ) {}

  async record(input: AuditRecordInput): Promise<AuditEvent | null> {
    const event = this.buildEvent(
      input,
      this.userContext.getUserId(),
      this.normalizeIp(this.requestInfo.getIpAddress()),
      this.requestInfo.getUserAgent(),
    );
    if (!event.hasDiff) return null;
    return this.auditEventRepository.save(event);
  }

  async recordMany(inputs: AuditRecordInput[]): Promise<AuditEvent[]> {
    if (inputs.length === 0) return [];

    const userId = this.userContext.getUserId();
    const ipAddress = this.normalizeIp(this.requestInfo.getIpAddress());
    const userAgent = this.requestInfo.getUserAgent();

    const events = inputs
      .map((input) => this.buildEvent(input, userId, ipAddress, userAgent))
      .filter((event) => event.hasDiff);

    if (events.length === 0) return [];
    return this.auditEventRepository.saveMany(events);
  }

  query(
    filter: AuditEventQueryFilter,
    pagination?: AuditEventPagination,
  ): Promise<AuditEventPage> {
    return this.auditEventRepository.findMany(filter, pagination);
  }

  private buildEvent(
    input: AuditRecordInput,
    actorUserId: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): AuditEvent {
    return AuditEvent.create(
      input.action,
      input.entityType,
      input.entityId,
      actorUserId,
      input.before,
      input.after,
      input.metadata,
      ipAddress,
      userAgent,
    );
  }

  private normalizeIp(
    ip: string | string[] | undefined,
  ): string | undefined {
    if (!ip) return undefined;
    if (Array.isArray(ip)) return ip[0];
    return ip;
  }
}
