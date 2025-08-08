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
        communityHallId: doc.communityHallId.toString(),
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
      communityHallId: new Types.ObjectId(primitives.communityHallId),
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
      communityHallId: created.communityHallId._id.toString(),
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
        communityHallId: new Types.ObjectId(p.communityHallId),
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
        communityHallId: doc.communityHallId.toString(),
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
        communityHallId: doc.communityHallId.toString(),
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
      communityHallId: doc.communityHallId.toString(),
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
          communityHallId: new Types.ObjectId(primitives.communityHallId),
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
      communityHallId: updated.communityHallId.toString(),
      userId: updated.userId.toString(),
    });
  }

  async bulkUpdate(alertChildren: AlertChild[]): Promise<AlertChild[]> {
    const updated: AlertChild[] = [];

    for (const child of alertChildren) {
      const primitives = child.toPrimitives();

      const doc = await this.model
        .findOneAndUpdate(
          {
            documentNumber: primitives.documentNumber,
            communityHallId: new Types.ObjectId(primitives.communityHallId),
            userId: new Types.ObjectId(primitives.userId),
          },
          {
            documentNumber: primitives.documentNumber,
            fullName: primitives.fullName,
            gender: primitives.gender,
            childCode: primitives.childCode,
            admissionDate: primitives.admissionDate,
            birthday: primitives.birthday,
            communityHallId: new Types.ObjectId(primitives.communityHallId),
            userId: new Types.ObjectId(primitives.userId),
          },
          { new: true },
        )
        .lean();

      if (doc) {
        updated.push(
          AlertChild.fromPrimitives({
            id: doc._id.toString(),
            documentNumber: doc.documentNumber,
            fullName: doc.fullName,
            gender: doc.gender,
            childCode: doc.childCode,
            admissionDate: doc.admissionDate,
            birthday: doc.birthday,
            communityHallId: doc.communityHallId.toString(),
            userId: doc.userId.toString(),
          }),
        );
      }
    }

    return updated;
  }
}
