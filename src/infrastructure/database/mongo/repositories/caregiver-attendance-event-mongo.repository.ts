import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaregiverAttendanceEvent } from 'src/domain/entities/caregiver-attendance-event.entity';
import {
  CaregiverAttendanceEventRepository,
  CaregiverAttendanceEventFilter,
} from 'src/domain/repositories/caregiver-attendance-event.repository';
import {
  CaregiverAttendanceEvent as CaregiverAttendanceEventSchema,
  CaregiverAttendanceEventDocument,
} from '../schemas/caregiver-attendance-event.schema';

@Injectable()
export class CaregiverAttendanceEventMongoRepository
  implements CaregiverAttendanceEventRepository
{
  constructor(
    @InjectModel(CaregiverAttendanceEventSchema.name)
    private readonly model: Model<CaregiverAttendanceEventDocument>,
  ) {}

  async save(
    event: CaregiverAttendanceEvent,
  ): Promise<CaregiverAttendanceEvent> {
    const p = event.toPrimitives();
    const created = await this.model.create({
      caregiverId: p.caregiverId ? new Types.ObjectId(p.caregiverId) : null,
      communityHallId: p.communityHallId
        ? new Types.ObjectId(p.communityHallId)
        : null,
      localDate: p.localDate,
      blockId: p.blockId ?? null,
      reason: p.reason,
      source: p.source,
      metadata: p.metadata ?? null,
      recordedAt: p.recordedAt,
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<CaregiverAttendanceEvent | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByFilters(
    filter: CaregiverAttendanceEventFilter,
  ): Promise<CaregiverAttendanceEvent[]> {
    const query: Record<string, unknown> = {};
    if (filter.caregiverId) {
      query.caregiverId = new Types.ObjectId(filter.caregiverId);
    }
    if (filter.communityHallId) {
      query.communityHallId = new Types.ObjectId(filter.communityHallId);
    }
    if (filter.localDate) {
      query.localDate = filter.localDate;
    }
    if (filter.source) {
      query.source = filter.source;
    }

    const docs = await this.model
      .find(query)
      .sort({ recordedAt: -1 })
      .skip(filter.offset ?? 0)
      .limit(filter.limit ?? 50)
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: any): CaregiverAttendanceEvent {
    return CaregiverAttendanceEvent.fromPrimitives({
      id: doc._id.toString(),
      caregiverId: doc.caregiverId?.toString(),
      communityHallId: doc.communityHallId?.toString(),
      localDate: doc.localDate,
      blockId: doc.blockId ?? undefined,
      reason: doc.reason,
      source: doc.source,
      metadata: doc.metadata ?? undefined,
      recordedAt: doc.recordedAt,
    });
  }
}
