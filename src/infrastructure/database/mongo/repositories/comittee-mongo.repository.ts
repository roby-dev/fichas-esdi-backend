import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Committee } from 'src/domain/entities/committe.entity';
import {
  Committee as CommitteeSchema,
  CommitteeDocument,
} from '../schemas/committee.schema';
import { CommitteeRepository } from 'src/domain/repositories/committee.repository';

@Injectable()
export class CommitteeMongoRepository implements CommitteeRepository {
  constructor(
    @InjectModel(CommitteeSchema.name)
    private readonly model: Model<CommitteeDocument>,
  ) {}

  async save(entity: Committee): Promise<Committee> {
    const data = entity.toPrimitives();
    const created = await this.model.create({
      committeeId: data.committeeId,
      name: data.name,
    });

    return Committee.fromPrimitives({
      id: created._id.toString(),
      committeeId: created.committeeId,
      name: created.name,
    });
  }

  async findById(id: string): Promise<Committee | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;

    return Committee.fromPrimitives({
      id: doc._id.toString(),
      committeeId: doc.committeeId,
      name: doc.name,
    });
  }

  async findAll(limit = 10, offset = 0): Promise<Committee[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();
    return docs.map((doc) =>
      Committee.fromPrimitives({
        committeeId: doc.committeeId,
        name: doc.name,
        id: doc._id.toString(),
      }),
    );
  }

  async update(entity: Committee): Promise<Committee> {
    const updated = await this.model
      .findByIdAndUpdate(entity.id, { name: entity.name }, { new: true })
      .lean();

    if (!updated) {
      throw new Error(`Committee with id ${entity.id} not found`);
    }

    return new Committee(
      updated.committeeId,
      updated.name,
      updated._id.toString(),
    );
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }
}
