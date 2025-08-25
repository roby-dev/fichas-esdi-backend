import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ManagementCommittee } from 'src/domain/entities/management-committe.entity';
import {
  ManagementCommittee as ManagementCommitteeSchema,
  ManagementCommitteeDocument,
} from '../schemas/management-committee.schema';
import { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';
import { User } from 'src/domain/entities/user.entity';

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
      userId: new Types.ObjectId(data.userId),
    });

    return ManagementCommittee.fromPrimitives({
      id: created._id.toString(),
      committeeId: created.committeeId,
      userId: created.userId._id.toString(),
      name: created.name,
    });
  }

  async findById(id: string): Promise<ManagementCommittee | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;

    return ManagementCommittee.fromPrimitives({
      id: doc._id.toString(),
      committeeId: doc.committeeId,
      userId: doc.userId._id.toString(),
      name: doc.name,
    });
  }

  async findAll(limit = 10, offset = 0): Promise<ManagementCommittee[]> {
    const docs = await this.model
      .find()
      .skip(offset)
      .limit(limit)
      .populate('userId')
      .lean();
    return docs.map((doc) =>
      ManagementCommittee.fromPrimitives({
        committeeId: doc.committeeId,
        name: doc.name,
        userId: doc.userId._id.toString(),
        id: doc._id.toString(),
        user:
          typeof doc.userId === 'object'
            ? this.convertToUser(doc.userId)
            : undefined,
      }),
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
      userId: managementCommittee.userId._id.toString(),
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
      .find({ userId: new Types.ObjectId(userId) })
      .skip(offset)
      .limit(limit)
      .lean();
    return docs.map((doc) =>
      ManagementCommittee.fromPrimitives({
        committeeId: doc.committeeId,
        name: doc.name,
        userId: doc.userId._id.toString(),
        id: doc._id.toString(),
      }),
    );
  }

  private convertToUser(raw: any): User {
    return User.fromPrimitives({
      id: raw._id.toString(),
      email: raw.email,
      passwordHash: '',
    });
  }
}
