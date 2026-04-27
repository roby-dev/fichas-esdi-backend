import { AuditEvent } from '../entities/audit-event.entity';

export interface AuditEventQueryFilter {
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

export interface AuditEventPagination {
  limit?: number;
  offset?: number;
}

export interface AuditEventPage {
  items: AuditEvent[];
  total: number;
}

export interface AuditEventRepository {
  save(event: AuditEvent): Promise<AuditEvent>;
  saveMany(events: AuditEvent[]): Promise<AuditEvent[]>;
  findMany(
    filter: AuditEventQueryFilter,
    pagination?: AuditEventPagination,
  ): Promise<AuditEventPage>;
}
