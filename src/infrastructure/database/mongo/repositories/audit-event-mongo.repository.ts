import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditEvent } from 'src/domain/entities/audit-event.entity';
import {
  AuditEventPage,
  AuditEventPagination,
  AuditEventQueryFilter,
  AuditEventRepository,
} from 'src/domain/repositories/audit-event.repository';
import {
  AuditEvent as AuditEventSchemaClass,
  AuditEventDocument,
} from '../schemas/audit-event.schema';

@Injectable()
export class AuditEventMongoRepository implements AuditEventRepository {
  constructor(
    @InjectModel(AuditEventSchemaClass.name)
    private readonly model: Model<AuditEventDocument>,
  ) {}

  async save(event: AuditEvent): Promise<AuditEvent> {
    const created = await this.model.create(this.toDoc(event));
    return this.toDomain(created);
  }

  async saveMany(events: AuditEvent[]): Promise<AuditEvent[]> {
    if (events.length === 0) return [];
    const docs = events.map((e) => this.toDoc(e));
    const created = await this.model.insertMany(docs);
    return created.map((c) => this.toDomain(c));
  }

  async findMany(
    filter: AuditEventQueryFilter,
    pagination?: AuditEventPagination,
  ): Promise<AuditEventPage> {
    const query = this.buildQuery(filter);
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;

    const [docs, total] = await Promise.all([
      this.model
        .find(query)
        .sort({ occurredAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      this.model.countDocuments(query),
    ]);

    return {
      items: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  private buildQuery(filter: AuditEventQueryFilter): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filter.actorUserId) {
      query.actorUserId = new Types.ObjectId(filter.actorUserId);
    }
    if (filter.entityType) {
      query.entityType = filter.entityType;
    }
    if (filter.entityId) {
      query.entityId = filter.entityId;
    }
    if (filter.action) {
      query.action = filter.action;
    }
    if (filter.from || filter.to) {
      const range: Record<string, Date> = {};
      if (filter.from) range.$gte = filter.from;
      if (filter.to) range.$lte = filter.to;
      query.occurredAt = range;
    }

    return query;
  }

  private toDoc(event: AuditEvent): Record<string, unknown> {
    const p = event.toPrimitives();
    return {
      action: p.action,
      entityType: p.entityType,
      entityId: p.entityId,
      actorUserId: new Types.ObjectId(p.actorUserId),
      actorEmail: p.actorEmail,
      occurredAt: p.occurredAt,
      before: p.before,
      after: p.after,
      metadata: p.metadata,
      ipAddress: p.ipAddress,
      userAgent: p.userAgent,
    };
  }

  private toDomain(doc: any): AuditEvent {
    return AuditEvent.fromPrimitives({
      id: doc._id.toString(),
      action: doc.action,
      entityType: doc.entityType,
      entityId: doc.entityId,
      actorUserId: doc.actorUserId.toString(),
      actorEmail: doc.actorEmail,
      occurredAt: doc.occurredAt,
      before: doc.before ?? null,
      after: doc.after ?? null,
      metadata: doc.metadata,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
    });
  }
}
