import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CommunityHall as CommunityCenterSchema,
  CommunityHallDocument,
} from '../schemas/community-hall.schema';
import { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';

@Injectable()
export class CommunityHallMongoRepository
  implements CommunityHallRepository
{
  constructor(
    @InjectModel(CommunityCenterSchema.name)
    private readonly model: Model<CommunityHallDocument>,
  ) {}

  async save(entity: CommunityHall): Promise<CommunityHall> {
    const data = entity.toPrimitives();
    const created = await this.model.create({
      name: data.name,
      managementCommitteeId: data.managementCommitteeId,
    });

    return CommunityHall.fromPrimitives({
      name: created.name,
      managementCommitteeId: created.managementCommitteeId.toString(),
      id: created._id.toString(),
    });
  }

  async findById(id: string): Promise<CommunityHall | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;

    return CommunityHall.fromPrimitives({
      name: doc.name,
      managementCommitteeId: doc.managementCommitteeId.toString(),
      id: doc._id.toString(),
    });
  }

  async findAll(limit = 10, offset = 0): Promise<CommunityHall[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();
    return docs.map((doc) =>
      CommunityHall.fromPrimitives({
        name: doc.name,
        managementCommitteeId: doc.managementCommitteeId.toString(),
        id: doc._id.toString(),
      }),
    );
  }

  async update(entity: CommunityHall): Promise<CommunityHall> {
    const doc = await this.model
      .findByIdAndUpdate(
        entity.id,
        {
          name: entity.name,
          managementCommitteeId: entity.managementCommitteeId,
        },
        { new: true },
      )
      .lean();

    if (!doc) {
      throw new Error(`CommunityCenter with id ${entity.id} not found`);
    }

    return CommunityHall.fromPrimitives({
      name: doc.name,
      managementCommitteeId: doc.managementCommitteeId.toString(),
      id: doc._id.toString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async findByNameAndCommitteeId(
    name: string,
    managementCommitteeId: string,
  ): Promise<CommunityHall | null> {
    const doc = await this.model
      .findOne({ name, managementCommitteeId })
      .lean();
    if (!doc) return null;

    return CommunityHall.fromPrimitives({
      name: doc.name,
      managementCommitteeId: doc.managementCommitteeId.toString(),
      id: doc._id.toString(),
    });
  }
}
