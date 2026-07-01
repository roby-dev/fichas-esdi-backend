import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaregiverAttendanceRecord } from 'src/domain/entities/caregiver-attendance-record.entity';
import { CaregiverAttendanceRepository } from 'src/domain/repositories/caregiver-attendance.repository';
import {
  CaregiverAttendanceRecord as CaregiverAttendanceRecordSchema,
  CaregiverAttendanceRecordDocument,
} from '../schemas/caregiver-attendance-record.schema';

@Injectable()
export class CaregiverAttendanceMongoRepository
  implements CaregiverAttendanceRepository
{
  constructor(
    @InjectModel(CaregiverAttendanceRecordSchema.name)
    private readonly model: Model<CaregiverAttendanceRecordDocument>,
  ) {}

  async save(
    record: CaregiverAttendanceRecord,
  ): Promise<CaregiverAttendanceRecord> {
    const p = record.toPrimitives();
    const created = await this.model.create({
      caregiverId: new Types.ObjectId(p.caregiverId),
      communityHallId: new Types.ObjectId(p.communityHallId),
      localDate: p.localDate,
      blockId: p.blockId,
      markKind: p.markKind,
      entryTime: p.entryTime ?? null,
      exitTime: p.exitTime ?? null,
      source: p.source,
      reason: p.reason ?? null,
      performerId: p.performerId ? new Types.ObjectId(p.performerId) : null,
      isVoided: p.isVoided,
      voidedAt: p.voidedAt ?? null,
      correctedFromId: p.correctedFromId ?? null,
      recordedAt: p.recordedAt,
      metadata: p.metadata ?? null,
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<CaregiverAttendanceRecord | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByCaregiverAndDate(
    caregiverId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceRecord[]> {
    const docs = await this.model
      .find({
        caregiverId: new Types.ObjectId(caregiverId),
        localDate,
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByHallAndDate(
    hallId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceRecord[]> {
    const docs = await this.model
      .find({
        communityHallId: new Types.ObjectId(hallId),
        localDate,
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByHallAndDateRange(
    hallId: string,
    from: string,
    to: string,
  ): Promise<CaregiverAttendanceRecord[]> {
    const docs = await this.model
      .find({
        communityHallId: new Types.ObjectId(hallId),
        localDate: { $gte: from, $lte: to },
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async existsOfficialMark(
    caregiverId: string,
    localDate: string,
    blockId: string,
  ): Promise<boolean> {
    const count = await this.model.countDocuments({
      caregiverId: new Types.ObjectId(caregiverId),
      localDate,
      blockId,
      markKind: 'official',
      isVoided: false,
    });
    return count > 0;
  }

  async voidMark(id: string): Promise<CaregiverAttendanceRecord> {
    const existing = await this.model.findById(id).lean();
    if (!existing) {
      throw new Error(`CaregiverAttendanceRecord with id ${id} not found`);
    }
    const domain = this.toDomain(existing);
    const voided = domain.void();
    const updated = await this.model
      .findByIdAndUpdate(
        id,
        { $set: { isVoided: true, voidedAt: voided.voidedAt } },
        { new: true },
      )
      .lean();
    return this.toDomain(updated);
  }

  private toDomain(doc: any): CaregiverAttendanceRecord {
    return CaregiverAttendanceRecord.fromPrimitives({
      id: doc._id.toString(),
      caregiverId: doc.caregiverId.toString(),
      communityHallId: doc.communityHallId.toString(),
      localDate: doc.localDate,
      blockId: doc.blockId,
      markKind: doc.markKind,
      entryTime: doc.entryTime ?? undefined,
      exitTime: doc.exitTime ?? null,
      source: doc.source,
      reason: doc.reason ?? undefined,
      performerId: doc.performerId?.toString() ?? undefined,
      isVoided: doc.isVoided,
      voidedAt: doc.voidedAt,
      correctedFromId: doc.correctedFromId ?? null,
      recordedAt: doc.recordedAt,
      metadata: doc.metadata ?? undefined,
    });
  }
}
