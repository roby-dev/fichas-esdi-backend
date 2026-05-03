import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CommunityHall as CommunityHallSchema,
  CommunityHallDocument,
} from '../schemas/community-hall.schema';
import { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { Committee } from 'src/domain/entities/committee.entity';

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
      committeeRef: new Types.ObjectId(data.committeeRef),
    });

    return CommunityHall.fromPrimitives({
      localId: created.localId,
      name: created.name,
      committeeRef: created.committeeRef.toString(),
      id: created._id.toString(),
      committee: entity.committee,
    });
  }

  async findById(id: string): Promise<CommunityHall | null> {
    const doc = await this.model.findById(id).populate('committeeRef').lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(limit = 10, offset = 0): Promise<CommunityHall[]> {
    const docs = await this.model
      .find()
      .skip(offset)
      .limit(limit)
      .populate('committeeRef')
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAllUnpaginated(): Promise<CommunityHall[]> {
    const docs = await this.model.find().populate('committeeRef').lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async update(entity: CommunityHall): Promise<CommunityHall> {
    const doc = await this.model
      .findByIdAndUpdate(
        entity.id,
        {
          localId: entity.localId,
          name: entity.name,
          committeeRef: new Types.ObjectId(entity.committeeRef),
        },
        { new: true },
      )
      .lean();

    if (!doc) {
      throw new Error(`CommunityHall with id ${entity.id} not found`);
    }

    return this.toDomain(doc);
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async findByNameAndCommitteeRef(
    name: string,
    committeeRef: string,
  ): Promise<CommunityHall | null> {
    const doc = await this.model
      .findOne({
        name,
        committeeRef: new Types.ObjectId(committeeRef),
      })
      .populate('committeeRef')
      .lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAllByCommitteeRef(
    committeeRef: string,
    limit = 10,
    offset = 0,
  ): Promise<CommunityHall[]> {
    const docs = await this.model
      .find({ committeeRef: new Types.ObjectId(committeeRef) })
      .skip(offset)
      .limit(limit)
      .populate('committeeRef')
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  private toDomain(doc: any): CommunityHall {
    const committeeRefRaw = doc.committeeRef;

    let committeeRefId = '';
    if (committeeRefRaw) {
      if (typeof committeeRefRaw === 'object' && committeeRefRaw._id) {
        committeeRefId = committeeRefRaw._id.toString();
      } else {
        committeeRefId = committeeRefRaw.toString();
      }
    }

    const committee =
      committeeRefRaw && typeof committeeRefRaw === 'object' && committeeRefRaw.name
        ? Committee.fromPrimitives({
            id: committeeRefRaw._id.toString(),
            committeeId: committeeRefRaw.committeeId,
            name: committeeRefRaw.name,
          })
        : undefined;

    return CommunityHall.fromPrimitives({
      id: doc._id.toString(),
      localId: doc.localId,
      name: doc.name,
      committeeRef: committeeRefId,
      committee,
    });
  }
}
