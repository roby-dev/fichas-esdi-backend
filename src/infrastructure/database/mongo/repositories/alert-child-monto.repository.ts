import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AlertChild } from 'src/domain/entities/alert-child.entity';
import { AlertChildRepository } from 'src/domain/repositories/alert-child.repository';
import {
  AlertChild as AlertSchema,
  AlertChildDocument,
} from '../schemas/alert-child.schema';

@Injectable()
export class AlertChildMongoRepository implements AlertChildRepository {
  constructor(
    @InjectModel(AlertSchema.name)
    private readonly model: Model<AlertChildDocument>,
  ) {}

  async findAllByUserId(userId: string): Promise<AlertChild[]> {
    const docs = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .lean();

    return docs.map((doc) =>
      AlertChild.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        fullName: doc.fullName,
        gender: doc.gender,
        childCode: doc.childCode,
        admissionDate: doc.admissionDate,
        birthday: doc.birthday,
        managementCommitteName: doc.managementCommitteName,
        managementCommitteCode: doc.managementCommitteCode,
        communityHallName: doc.communityHallName,
        communityHallId: doc.communityHallId,
        userId: doc.userId.toString(),
      }),
    );
  }

  async save(alertChild: AlertChild): Promise<AlertChild> {
    const primitives = alertChild.toPrimitives();
    const created = await this.model.create({
      documentNumber: primitives.documentNumber,
      fullName: primitives.fullName,
      gender: primitives.gender,
      childCode: primitives.childCode,
      admissionDate: primitives.admissionDate,
      birthday: primitives.birthday,
      managementCommitteName: primitives.managementCommitteName,
      managementCommitteCode: primitives.managementCommitteCode,
      communityHallName: primitives.communityHallName,
      communityHallId: primitives.communityHallId,
      userId: new Types.ObjectId(primitives.userId),
    });

    return AlertChild.fromPrimitives({
      id: created._id.toString(),
      documentNumber: created.documentNumber,
      fullName: created.fullName,
      gender: created.gender,
      childCode: created.childCode,
      admissionDate: created.admissionDate,
      birthday: created.birthday,
      managementCommitteName: created.managementCommitteName,
      managementCommitteCode: created.managementCommitteCode,
      communityHallName: created.communityHallName,
      communityHallId: created.communityHallId,
      userId: created.userId._id.toString(),
    });
  }

  async bulkSave(alertChildren: AlertChild[]): Promise<AlertChild[]> {
    const docs = alertChildren.map((child) => {
      const p = child.toPrimitives();
      return {
        documentNumber: p.documentNumber,
        fullName: p.fullName,
        gender: p.gender,
        childCode: p.childCode,
        admissionDate: p.admissionDate,
        birthday: p.birthday,
        managementCommitteName: p.managementCommitteName,
        managementCommitteCode: p.managementCommitteCode,
        communityHallName: p.communityHallName,
        communityHallId: p.communityHallId,
        userId: new Types.ObjectId(p.userId),
      };
    });

    const created = await this.model.insertMany(docs);

    return created.map((doc) =>
      AlertChild.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        fullName: doc.fullName,
        gender: doc.gender,
        childCode: doc.childCode,
        admissionDate: doc.admissionDate,
        birthday: doc.birthday,
        managementCommitteName: doc.managementCommitteName,
        managementCommitteCode: doc.managementCommitteCode,
        communityHallName: doc.communityHallName,
        communityHallId: doc.communityHallId,
        userId: doc.userId.toString(),
      }),
    );
  }

  async findAll(limit = 50, offset = 0): Promise<AlertChild[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();

    return docs.map((doc) =>
      AlertChild.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        fullName: doc.fullName,
        gender: doc.gender,
        childCode: doc.childCode,
        admissionDate: doc.admissionDate,
        birthday: doc.birthday,
        managementCommitteName: doc.managementCommitteName,
        managementCommitteCode: doc.managementCommitteCode,
        communityHallName: doc.communityHallName,
        communityHallId: doc.communityHallId,
        userId: doc.userId.toString(),
      }),
    );
  }

  async findById(id: string): Promise<AlertChild | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;

    return AlertChild.fromPrimitives({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber,
      fullName: doc.fullName,
      gender: doc.gender,
      childCode: doc.childCode,
      admissionDate: doc.admissionDate,
      birthday: doc.birthday,
      managementCommitteName: doc.managementCommitteName,
      managementCommitteCode: doc.managementCommitteCode,
      communityHallName: doc.communityHallName,
      communityHallId: doc.communityHallId,
      userId: doc.userId.toString(),
    });
  }

  async update(alertChild: AlertChild): Promise<AlertChild> {
    if (!alertChild.id) {
      throw new Error('Cannot update AlertChild without an ID');
    }

    const primitives = alertChild.toPrimitives();
    const updated = await this.model
      .findByIdAndUpdate(
        alertChild.id,
        {
          documentNumber: primitives.documentNumber,
          fullName: primitives.fullName,
          gender: primitives.gender,
          childCode: primitives.childCode,
          admissionDate: primitives.admissionDate,
          birthday: primitives.birthday,
          managementCommitteName: primitives.managementCommitteName,
          managementCommitteCode: primitives.managementCommitteCode,
          communityHallName: primitives.communityHallName,
          communityHallId: primitives.communityHallId,
          userId: new Types.ObjectId(primitives.userId),
        },
        { new: true },
      )
      .lean();

    if (!updated) {
      throw new Error(`AlertChild with ID ${alertChild.id} not found`);
    }

    return AlertChild.fromPrimitives({
      id: updated._id.toString(),
      documentNumber: updated.documentNumber,
      fullName: updated.fullName,
      gender: updated.gender,
      childCode: updated.childCode,
      admissionDate: updated.admissionDate,
      birthday: updated.birthday,
      managementCommitteName: updated.managementCommitteName,
      managementCommitteCode: updated.managementCommitteCode,
      communityHallName: updated.communityHallName,
      communityHallId: updated.communityHallId,
      userId: updated.userId.toString(),
    });
  }

  async bulkUpdate(alertChildren: AlertChild[]): Promise<AlertChild[]> {
    const ops = alertChildren.map((child) => {
      if (!child.id) {
        throw new Error('Cannot bulk update without ID');
      }
      const p = child.toPrimitives();
      return {
        updateOne: {
          filter: { _id: new Types.ObjectId(p.id) },
          update: {
            $set: {
              documentNumber: p.documentNumber,
              fullName: p.fullName,
              gender: p.gender,
              childCode: p.childCode,
              admissionDate: p.admissionDate,
              birthday: p.birthday,
              managementCommitteName: p.managementCommitteName,
              managementCommitteCode: p.managementCommitteCode,
              communityHallName: p.communityHallName,
              communityHallId: p.communityHallId,
              userId: new Types.ObjectId(p.userId),
            },
          },
        },
      };
    });

    await this.model.bulkWrite(ops, { ordered: false });

    const ids = alertChildren.map((c) => new Types.ObjectId(c.id!));
    const updatedDocs = await this.model.find({ _id: { $in: ids } }).lean();

    return updatedDocs.map((doc) =>
      AlertChild.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        fullName: doc.fullName,
        gender: doc.gender,
        childCode: doc.childCode,
        admissionDate: doc.admissionDate,
        birthday: doc.birthday,
        managementCommitteName: doc.managementCommitteName,
        managementCommitteCode: doc.managementCommitteCode,
        communityHallName: doc.communityHallName,
        communityHallId: doc.communityHallId,
        userId: doc.userId.toString(),
      }),
    );
  }
}
