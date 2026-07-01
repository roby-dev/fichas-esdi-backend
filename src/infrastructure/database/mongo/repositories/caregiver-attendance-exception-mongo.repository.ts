import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaregiverAttendanceException } from 'src/domain/entities/caregiver-attendance-exception.entity';
import { CaregiverAttendanceExceptionRepository } from 'src/domain/repositories/caregiver-attendance-exception.repository';
import {
  CaregiverAttendanceException as CaregiverAttendanceExceptionSchema,
  CaregiverAttendanceExceptionDocument,
} from '../schemas/caregiver-attendance-exception.schema';

@Injectable()
export class CaregiverAttendanceExceptionMongoRepository
  implements CaregiverAttendanceExceptionRepository
{
  constructor(
    @InjectModel(CaregiverAttendanceExceptionSchema.name)
    private readonly model: Model<CaregiverAttendanceExceptionDocument>,
  ) {}

  async save(
    exception: CaregiverAttendanceException,
  ): Promise<CaregiverAttendanceException> {
    const p = exception.toPrimitives();
    const created = await this.model.create({
      scope: p.scope,
      communityHallId: p.communityHallId
        ? new Types.ObjectId(p.communityHallId)
        : null,
      caregiverId: p.caregiverId ? new Types.ObjectId(p.caregiverId) : null,
      localDate: p.localDate,
      blockId: p.blockId ?? null,
      kind: p.kind,
      status: p.status,
      reason: p.reason,
      requestedBy: p.requestedBy ? new Types.ObjectId(p.requestedBy) : null,
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<CaregiverAttendanceException | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByHallAndDate(
    hallId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceException[]> {
    const docs = await this.model
      .find({
        scope: 'hall',
        communityHallId: new Types.ObjectId(hallId),
        localDate,
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByCaregiverAndDate(
    caregiverId: string,
    localDate: string,
  ): Promise<CaregiverAttendanceException[]> {
    const docs = await this.model
      .find({
        scope: 'caregiver',
        caregiverId: new Types.ObjectId(caregiverId),
        localDate,
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByHallDateRange(
    hallId: string,
    from: string,
    to: string,
  ): Promise<CaregiverAttendanceException[]> {
    const docs = await this.model
      .find({
        scope: 'hall',
        communityHallId: new Types.ObjectId(hallId),
        localDate: { $gte: from, $lte: to },
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByCaregiverDateRange(
    caregiverId: string,
    from: string,
    to: string,
  ): Promise<CaregiverAttendanceException[]> {
    const docs = await this.model
      .find({
        scope: 'caregiver',
        caregiverId: new Types.ObjectId(caregiverId),
        localDate: { $gte: from, $lte: to },
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: any): CaregiverAttendanceException {
    return CaregiverAttendanceException.fromPrimitives({
      id: doc._id.toString(),
      scope: doc.scope,
      communityHallId: doc.communityHallId?.toString(),
      caregiverId: doc.caregiverId?.toString(),
      localDate: doc.localDate,
      blockId: doc.blockId ?? undefined,
      kind: doc.kind,
      status: doc.status,
      reason: doc.reason,
      requestedBy: doc.requestedBy?.toString(),
      createdAt: doc.createdAt,
    });
  }
}
