import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CommunityHall as CommunityHallSchema,
  CommunityHallDocument,
} from '../schemas/community-hall.schema';
import { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { ManagementCommittee } from 'src/domain/entities/management-committe.entity';

@Injectable()
export class CommunityHallMongoRepository implements CommunityHallRepository {
  constructor(
    @InjectModel(CommunityHallSchema.name)
    private readonly model: Model<CommunityHallDocument>,
  ) {}

  async save(entity: CommunityHall): Promise<CommunityHall> {
    const data = entity.toPrimitives();
    const created = await this.model.create({
      localId: data.localId,
      name: data.name,
      managementCommitteeId: new Types.ObjectId(data.managementCommitteeId),
    });

    return CommunityHall.fromPrimitives({
      localId: created.localId,
      name: created.name,
      managementCommitteeId: created.managementCommitteeId._id.toString(),
      id: created._id.toString(),
      managementCommittee: entity.managementCommittee,
    });
  }

  async findById(id: string): Promise<CommunityHall | null> {
    const doc = await this.model
      .findById(id)
      .populate('managementCommitteeId')
      .lean();
    if (!doc) return null;

    return CommunityHall.fromPrimitives({
      localId: doc.localId,
      name: doc.name,
      managementCommitteeId: doc.managementCommitteeId._id.toString(),
      id: doc._id.toString(),
      managementCommittee:
        typeof doc.managementCommitteeId === 'object'
          ? this.convertToManagementCommittee(doc.managementCommitteeId)
          : undefined,
    });
  }

  async findAll(limit = 10, offset = 0): Promise<CommunityHall[]> {
    const docs = await this.model
      .find()
      .skip(offset)
      .limit(limit)
      .populate('managementCommitteeId')
      .lean();
    return docs.map((doc) =>
      CommunityHall.fromPrimitives({
        localId: doc.localId,
        name: doc.name,
        managementCommitteeId: doc.managementCommitteeId._id.toString(),
        id: doc._id.toString(),
        managementCommittee:
          typeof doc.managementCommitteeId === 'object'
            ? this.convertToManagementCommittee(doc.managementCommitteeId)
            : undefined,
      }),
    );
  }

  async update(entity: CommunityHall): Promise<CommunityHall> {
    const doc = await this.model
      .findByIdAndUpdate(
        entity.id,
        {
          localId: entity.localId,
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
      localId: doc.localId,
      name: doc.name,
      managementCommitteeId: doc.managementCommitteeId._id.toString(),
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
      .findOne({
        name,
        managementCommitteeId: new Types.ObjectId(managementCommitteeId),
      })
      .populate('managementCommitteeId')
      .lean();
    if (!doc) return null;

    return CommunityHall.fromPrimitives({
      localId: doc.localId,
      name: doc.name,
      managementCommitteeId: doc.managementCommitteeId._id.toString(),
      id: doc._id.toString(),
      managementCommittee:
        typeof doc.managementCommitteeId === 'object'
          ? this.convertToManagementCommittee(doc.managementCommitteeId)
          : undefined,
    });
  }

  async findAllByCommitteeId(
    managementCommitteeId: string,
    limit = 10,
    offset = 0,
  ): Promise<CommunityHall[]> {
    const docs = await this.model
      .find({
        managementCommitteeId: new Types.ObjectId(managementCommitteeId),
      })
      .skip(offset)
      .limit(limit)
      .populate('managementCommitteeId')
      .lean();

    return docs.map((doc) =>
      CommunityHall.fromPrimitives({
        localId: doc.localId,
        name: doc.name,
        managementCommitteeId: doc.managementCommitteeId._id.toString(),
        id: doc._id.toString(),
        managementCommittee:
          typeof doc.managementCommitteeId === 'object'
            ? this.convertToManagementCommittee(doc.managementCommitteeId)
            : undefined,
      }),
    );
  }

  private convertToManagementCommittee(raw: any): ManagementCommittee {
    return ManagementCommittee.fromPrimitives({
      id: raw._id.toString(),
      committeeId: raw.committeeId,
      userId: raw.userId.toString(),
      name: raw.name,
    });
  }
}
