import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommitteeMembership } from 'src/domain/entities/committee-membership.entity';
import { CommitteeMembershipRepository } from 'src/domain/repositories/committee-membership.repository';
import { Committee } from 'src/domain/entities/committee.entity';
import { User } from 'src/domain/entities/user.entity';
import {
  CommitteeMembership as CommitteeMembershipSchema,
  CommitteeMembershipDocument,
} from '../schemas/committee-membership.schema';

@Injectable()
export class CommitteeMembershipMongoRepository
  implements CommitteeMembershipRepository
{
  constructor(
    @InjectModel(CommitteeMembershipSchema.name)
    private readonly model: Model<CommitteeMembershipDocument>,
  ) {}

  async save(entity: CommitteeMembership): Promise<CommitteeMembership> {
    const data = entity.toPrimitives();
    const created = await this.model.create({
      committeeRef: new Types.ObjectId(data.committeeRef),
      userRef: new Types.ObjectId(data.userRef),
    });

    return CommitteeMembership.fromPrimitives({
      id: created._id.toString(),
      committeeRef: created.committeeRef.toString(),
      userRef: created.userRef.toString(),
    });
  }

  async findById(id: string): Promise<CommitteeMembership | null> {
    const doc = await this.model
      .findById(id)
      .populate('committeeRef')
      .populate('userRef')
      .lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByCommitteeAndUser(
    committeeRef: string,
    userRef: string,
  ): Promise<CommitteeMembership | null> {
    const doc = await this.model
      .findOne({
        committeeRef: new Types.ObjectId(committeeRef),
        userRef: new Types.ObjectId(userRef),
      })
      .lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAllByUserRef(
    userRef: string,
    limit = 10,
    offset = 0,
  ): Promise<CommitteeMembership[]> {
    const docs = await this.model
      .find({ userRef: new Types.ObjectId(userRef) })
      .skip(offset)
      .limit(limit)
      .populate('committeeRef')
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAllByCommitteeRef(
    committeeRef: string,
    limit = 10,
    offset = 0,
  ): Promise<CommitteeMembership[]> {
    const docs = await this.model
      .find({ committeeRef: new Types.ObjectId(committeeRef) })
      .skip(offset)
      .limit(limit)
      .populate('userRef')
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(limit = 10, offset = 0): Promise<CommitteeMembership[]> {
    const docs = await this.model
      .find()
      .skip(offset)
      .limit(limit)
      .populate('committeeRef')
      .populate('userRef')
      .lean();
    return docs.map((doc) => this.toDomain(doc));
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  private toDomain(doc: any): CommitteeMembership {
    const committeeRefRaw = doc.committeeRef;
    const userRefRaw = doc.userRef;

    let committeeRefId = '';
    if (committeeRefRaw) {
      committeeRefId =
        typeof committeeRefRaw === 'object' && committeeRefRaw._id
          ? committeeRefRaw._id.toString()
          : committeeRefRaw.toString();
    }

    let userRefId = '';
    if (userRefRaw) {
      userRefId =
        typeof userRefRaw === 'object' && userRefRaw._id
          ? userRefRaw._id.toString()
          : userRefRaw.toString();
    }

    const committee =
      committeeRefRaw && typeof committeeRefRaw === 'object' && committeeRefRaw.name
        ? Committee.fromPrimitives({
            id: committeeRefRaw._id.toString(),
            committeeId: committeeRefRaw.committeeId,
            name: committeeRefRaw.name,
          })
        : undefined;

    const user =
      userRefRaw && typeof userRefRaw === 'object' && userRefRaw.email
        ? User.fromPrimitives({
            id: userRefRaw._id.toString(),
            email: userRefRaw.email,
            passwordHash: '',
          })
        : undefined;

    return CommitteeMembership.fromPrimitives({
      id: doc._id.toString(),
      committeeRef: committeeRefId,
      userRef: userRefId,
      committee,
      user,
    });
  }
}
