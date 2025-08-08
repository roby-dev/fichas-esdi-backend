import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ManagementCommittee } from 'src/domain/entities/management-committe.entity';
import {
  ManagementCommittee as ManagementCommitteeSchema,
  ManagementCommitteeDocument,
} from '../schemas/management-committee.schema';
import { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';

@Injectable()
export class ManagementCommitteeMongoRepository
  implements ManagementCommitteeRepository
{
  constructor(
    @InjectModel(ManagementCommitteeSchema.name)
    private readonly model: Model<ManagementCommitteeDocument>,
  ) {}

  async save(entity: ManagementCommittee): Promise<ManagementCommittee> {
    const data = entity.toPrimitives();
    const created = await this.model.create({
      committeeId: data.committeeId,
      name: data.name,
      userId: data.userId,
    });

    return ManagementCommittee.fromPrimitives({
      id: created._id.toString(),
      committeeId: created.committeeId,
      userId: created.userId.toString(),
      name: created.name,
    });
  }

  async findById(id: string): Promise<ManagementCommittee | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;

    return ManagementCommittee.fromPrimitives({
      id: doc._id.toString(),
      committeeId: doc.committeeId,
      userId: doc.userId.toString(),
      name: doc.name,
    });
  }

  async findAll(limit = 10, offset = 0): Promise<ManagementCommittee[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();
    return docs.map(
      (doc) =>
        new ManagementCommittee(doc.committeeId, doc.name, doc._id.toString()),
    );
  }

  async update(entity: ManagementCommittee): Promise<ManagementCommittee> {
    const updated = await this.model
      .findByIdAndUpdate(entity.id, { name: entity.name }, { new: true })
      .lean();

    if (!updated) {
      throw new Error(`ManagementCommittee with id ${entity.id} not found`);
    }

    return new ManagementCommittee(
      updated.committeeId,
      updated.name,
      updated._id.toString(),
    );
  }

  async findByName(
    name: string,
    userId: string,
  ): Promise<ManagementCommittee | null> {
    const managementCommittee = await this.model
      .findOne({ name, userId })
      .exec();
    if (!managementCommittee) return null;

    return ManagementCommittee.fromPrimitives({
      committeeId: managementCommittee.committeeId,
      name: managementCommittee.name,
      userId: managementCommittee.userId.toString(),
      id: managementCommittee._id.toString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async findAllByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<ManagementCommittee[]> {
    const docs = await this.model
      .find({ userId })
      .skip(offset)
      .limit(limit)
      .lean();
    return docs.map((doc) =>
      ManagementCommittee.fromPrimitives({
        committeeId: doc.committeeId,
        name: doc.name,
        userId: doc.userId.toString(),
        id: doc._id.toString(),
      }),
    );
  }
}
