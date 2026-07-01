import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';
import { CaregiverScheduleRepository } from 'src/domain/repositories/caregiver-schedule.repository';
import {
  CaregiverScheduleVersion as CaregiverScheduleVersionSchema,
  CaregiverScheduleVersionDocument,
} from '../schemas/caregiver-schedule-version.schema';

@Injectable()
export class CaregiverScheduleMongoRepository
  implements CaregiverScheduleRepository
{
  constructor(
    @InjectModel(CaregiverScheduleVersionSchema.name)
    private readonly model: Model<CaregiverScheduleVersionDocument>,
  ) {}

  async save(
    version: CaregiverScheduleVersion,
  ): Promise<CaregiverScheduleVersion> {
    const p = version.toPrimitives();
    const created = await this.model.create({
      communityHallId: new Types.ObjectId(p.communityHallId),
      name: p.name,
      validFrom: p.validFrom,
      validTo: p.validTo ?? null,
      blocks: p.blocks,
      dayRules: p.dayRules,
      specialDays: p.specialDays ?? [],
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<CaregiverScheduleVersion | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findActiveByHallAndDate(
    hallId: string,
    date: Date,
  ): Promise<CaregiverScheduleVersion | null> {
    const doc = await this.model
      .findOne({
        communityHallId: new Types.ObjectId(hallId),
        validFrom: { $lte: date },
        $or: [{ validTo: null }, { validTo: { $gte: date } }],
      })
      .sort({ validFrom: -1 })
      .lean();
    return doc ? this.toDomain(doc) : null;
  }

  async findByHallId(hallId: string): Promise<CaregiverScheduleVersion[]> {
    const docs = await this.model
      .find({ communityHallId: new Types.ObjectId(hallId) })
      .sort({ validFrom: 1 })
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async closeCurrentVersion(hallId: string, validTo: Date): Promise<void> {
    await this.model.updateOne(
      { communityHallId: new Types.ObjectId(hallId), validTo: null },
      { $set: { validTo } },
    );
  }

  async copyToHall(
    versionId: string,
    targetHallId: string,
    validFrom: Date,
    name: string,
  ): Promise<CaregiverScheduleVersion> {
    const source = await this.findById(versionId);
    if (!source) {
      throw new Error(
        `CaregiverScheduleVersion with id ${versionId} not found`,
      );
    }
    const copy = source.copyToHall({
      communityHallId: targetHallId,
      validFrom,
      name,
    });
    return this.save(copy);
  }

  private toDomain(doc: any): CaregiverScheduleVersion {
    return CaregiverScheduleVersion.fromPrimitives({
      id: doc._id.toString(),
      communityHallId: doc.communityHallId.toString(),
      name: doc.name,
      validFrom: doc.validFrom,
      validTo: doc.validTo,
      blocks: doc.blocks,
      dayRules: doc.dayRules,
      specialDays: doc.specialDays ?? [],
    });
  }
}
