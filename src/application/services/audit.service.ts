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
  actorType?: 'user' | 'system' | 'caregiver';
  actorIdentifier?: string;
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
      input.actorIdentifier ?? this.userContext.getUserId(),
      input.actorIdentifier ?? this.userContext.getUserEmail(),
      this.normalizeIp(this.requestInfo.getIpAddress()),
      this.requestInfo.getUserAgent(),
      input.actorType ?? 'user',
    );
    if (!event.hasDiff) return null;
    return this.auditEventRepository.save(event);
  }

  async recordMany(inputs: AuditRecordInput[]): Promise<AuditEvent[]> {
    if (inputs.length === 0) return [];

    const defaultUserId = this.userContext.getUserId();
    const defaultUserEmail = this.userContext.getUserEmail();
    const ipAddress = this.normalizeIp(this.requestInfo.getIpAddress());
    const userAgent = this.requestInfo.getUserAgent();

    const events = inputs
      .map((input) =>
        this.buildEvent(
          input,
          input.actorIdentifier ?? defaultUserId,
          input.actorIdentifier ?? defaultUserEmail,
          ipAddress,
          userAgent,
          input.actorType ?? 'user',
        ),
      )
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
    actorEmail: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    actorType: 'user' | 'system' | 'caregiver',
  ): AuditEvent {
    return AuditEvent.create(
      input.action,
      input.entityType,
      input.entityId,
      actorUserId,
      actorEmail,
      input.before,
      input.after,
      input.metadata,
      ipAddress,
      userAgent,
      actorType,
    );
  }

  private normalizeIp(ip: string | string[] | undefined): string | undefined {
    if (!ip) return undefined;
    if (Array.isArray(ip)) return ip[0];
    return ip;
  }
}
