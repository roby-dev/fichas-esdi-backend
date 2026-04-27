import { nowUtc } from '../../common/utils/functions';

export type AuditEventSnapshot = Record<string, unknown> | null;

export class AuditEvent {
  constructor(
    private readonly _action: string,
    private readonly _entityType: string,
    private readonly _entityId: string,
    private readonly _actorUserId: string,
    private readonly _occurredAt: Date,
    private readonly _before: AuditEventSnapshot,
    private readonly _after: AuditEventSnapshot,
    private readonly _metadata?: Record<string, unknown>,
    private readonly _ipAddress?: string,
    private readonly _userAgent?: string,
    private readonly _id?: string,
  ) {}

  get action(): string {
    return this._action;
  }

  get entityType(): string {
    return this._entityType;
  }

  get entityId(): string {
    return this._entityId;
  }

  get actorUserId(): string {
    return this._actorUserId;
  }

  get occurredAt(): Date {
    return this._occurredAt;
  }

  get before(): AuditEventSnapshot {
    return this._before;
  }

  get after(): AuditEventSnapshot {
    return this._after;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata;
  }

  get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get id(): string | undefined {
    return this._id;
  }

  get changedFields(): string[] {
    const keys = new Set<string>([
      ...Object.keys(this._before ?? {}),
      ...Object.keys(this._after ?? {}),
    ]);

    const changed: string[] = [];
    for (const key of keys) {
      const a = this._before?.[key];
      const b = this._after?.[key];
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        changed.push(key);
      }
    }
    return changed;
  }

  get hasDiff(): boolean {
    return this.changedFields.length > 0;
  }

  static create(
    action: string,
    entityType: string,
    entityId: string,
    actorUserId: string,
    before: AuditEventSnapshot,
    after: AuditEventSnapshot,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ): AuditEvent {
    return new AuditEvent(
      action,
      entityType,
      entityId,
      actorUserId,
      nowUtc(),
      before,
      after,
      metadata,
      ipAddress,
      userAgent,
      undefined,
    );
  }

  static fromPrimitives(data: {
    id?: string;
    action: string;
    entityType: string;
    entityId: string;
    actorUserId: string;
    occurredAt: Date;
    before: AuditEventSnapshot;
    after: AuditEventSnapshot;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    return new AuditEvent(
      data.action,
      data.entityType,
      data.entityId,
      data.actorUserId,
      data.occurredAt,
      data.before,
      data.after,
      data.metadata,
      data.ipAddress,
      data.userAgent,
      data.id,
    );
  }

  toPrimitives(): {
    id?: string;
    action: string;
    entityType: string;
    entityId: string;
    actorUserId: string;
    occurredAt: Date;
    before: AuditEventSnapshot;
    after: AuditEventSnapshot;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      id: this._id,
      action: this._action,
      entityType: this._entityType,
      entityId: this._entityId,
      actorUserId: this._actorUserId,
      occurredAt: this._occurredAt,
      before: this._before,
      after: this._after,
      metadata: this._metadata,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
    };
  }
}
