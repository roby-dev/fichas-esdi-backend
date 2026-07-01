import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaregiverHallAssignment } from 'src/domain/entities/caregiver-hall-assignment.entity';
import { CaregiverHallAssignmentRepository } from 'src/domain/repositories/caregiver-hall-assignment.repository';
import {
  CaregiverHallAssignment as CaregiverHallAssignmentSchema,
  CaregiverHallAssignmentDocument,
} from '../schemas/caregiver-hall-assignment.schema';

@Injectable()
export class CaregiverHallAssignmentMongoRepository
  implements CaregiverHallAssignmentRepository
{
  constructor(
    @InjectModel(CaregiverHallAssignmentSchema.name)
    private readonly model: Model<CaregiverHallAssignmentDocument>,
  ) {}

  async save(
    assignment: CaregiverHallAssignment,
  ): Promise<CaregiverHallAssignment> {
    const p = assignment.toPrimitives();
    const created = await this.model.create({
      caregiverId: new Types.ObjectId(p.caregiverId),
      communityHallId: new Types.ObjectId(p.communityHallId),
      validFrom: p.validFrom,
      validTo: p.validTo ?? null,
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<CaregiverHallAssignment | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByCaregiverId(
    caregiverId: string,
  ): Promise<CaregiverHallAssignment[]> {
    const docs = await this.model
      .find({ caregiverId: new Types.ObjectId(caregiverId) })
      .sort({ validFrom: 1 })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findActiveByCaregiverAndDate(
    caregiverId: string,
    date: Date,
  ): Promise<CaregiverHallAssignment | null> {
    const docs = await this.model
      .find({
        caregiverId: new Types.ObjectId(caregiverId),
        validFrom: { $lte: date },
        $or: [{ validTo: null }, { validTo: { $gte: date } }],
      })
      .sort({ validFrom: -1 })
      .limit(1)
      .lean();

    return docs[0] ? this.toDomain(docs[0]) : null;
  }

  async closeCurrentAssignment(
    caregiverId: string,
    validTo: Date,
  ): Promise<void> {
    await this.model.updateOne(
      { caregiverId: new Types.ObjectId(caregiverId), validTo: null },
      { $set: { validTo } },
    );
  }

  async findByHallIdAndDateRange(
    hallId: string,
    from: Date,
    to: Date,
  ): Promise<CaregiverHallAssignment[]> {
    const docs = await this.model
      .find({
        communityHallId: new Types.ObjectId(hallId),
        validFrom: { $lte: to },
        $or: [{ validTo: null }, { validTo: { $gte: from } }],
      })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByHallIds(hallIds: string[]): Promise<CaregiverHallAssignment[]> {
    const docs = await this.model
      .find({
        communityHallId: { $in: hallIds.map((id) => new Types.ObjectId(id)) },
      })
      .sort({ validFrom: 1 })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: any): CaregiverHallAssignment {
    return CaregiverHallAssignment.fromPrimitives({
      id: doc._id.toString(),
      caregiverId: doc.caregiverId.toString(),
      communityHallId: doc.communityHallId.toString(),
      validFrom: doc.validFrom,
      validTo: doc.validTo,
    });
  }
}
