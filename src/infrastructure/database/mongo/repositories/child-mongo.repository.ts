import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child as ChildSchema, ChildDocument } from '../schemas/child.schema';
import { ChildRepository } from 'src/domain/repositories/child.repository';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';

@Injectable()
export class ChildMongoRepository implements ChildRepository {
  constructor(
    @InjectModel(ChildSchema.name)
    private readonly model: Model<ChildDocument>,
  ) {}

  async save(child: Child): Promise<Child> {
    const created = await this.model.create({
      documentNumber: child.documentNumber,
      firstName: child.firstName,
      lastName: child.lastName,
      birthday: child.birthday,
      admissionDate: child.admissionDate,
      communityHallId: new Types.ObjectId(child.communityHallId),
      userId: new Types.ObjectId(child.userId),
    });

    return Child.fromPrimitives({
      id: created._id.toString(),
      documentNumber: created.documentNumber,
      firstName: created.firstName,
      lastName: created.lastName,
      birthday: created.birthday,
      admissionDate: created.admissionDate,
      communityHallId: created.communityHallId?._id.toString(),
      userId: created.userId?._id.toString(),
    });
  }

  async update(child: Child): Promise<Child> {
    const updated = await this.model
      .findByIdAndUpdate(
        child.id,
        {
          documentNumber: child.documentNumber,
          firstName: child.firstName,
          lastName: child.lastName,
          birthday: child.birthday,
          admissionDate: child.admissionDate,
          communityHallId: child.communityHallId,
        },
        { new: true },
      )
      .lean();

    if (!updated) throw new Error(`Child with id ${child.id} not found`);

    return Child.fromPrimitives({
      id: updated._id.toString(),
      documentNumber: updated.documentNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      birthday: updated.birthday,
      admissionDate: updated.admissionDate,
      communityHallId: updated.communityHallId?._id.toString(),
      userId: updated.userId?._id.toString(),
    });
  }

  async findById(id: string): Promise<Child | null> {
    const doc = await this.model.findById(id).lean();
    if (!doc) return null;

    return Child.fromPrimitives({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      birthday: doc.birthday,
      admissionDate: doc.admissionDate,
      communityHallId: doc.communityHallId?._id.toString(),
      userId: doc.userId?._id.toString(),
    });
  }

  async findByDocumentNumber(documentNumber: string): Promise<Child | null> {
    const doc = await this.model.findOne({ documentNumber }).lean();
    if (!doc) return null;

    return Child.fromPrimitives({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      birthday: doc.birthday,
      admissionDate: doc.admissionDate,
      communityHallId: doc.communityHallId?._id.toString(),
      userId: doc.userId?._id.toString(),
    });
  }

  async findAll(limit = 10, offset = 0): Promise<Child[]> {
    const docs = await this.model.find().skip(offset).limit(limit).lean();
    return docs.map((doc) =>
      Child.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        firstName: doc.firstName,
        lastName: doc.lastName,
        birthday: doc.birthday,
        admissionDate: doc.admissionDate,
        communityHallId: doc.communityHallId?._id.toString(),
        userId: doc.userId?._id.toString(),
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async findByDocumentNumberAndCommunnityHallId(
    documentNumber: string,
    communityHallId: string,
  ): Promise<Child | null> {
    const doc = await this.model
      .findOne({
        documentNumber,
        communityHallId: new Types.ObjectId(communityHallId),
      })
      .lean();
    if (!doc) return null;

    return Child.fromPrimitives({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber,
      firstName: doc.firstName,
      lastName: doc.lastName,
      birthday: doc.birthday,
      admissionDate: doc.admissionDate,
      communityHallId: doc.communityHallId?._id.toString(),
      userId: doc.userId?._id.toString(),
    });
  }

  async findAlllByUser(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Child[]> {
    const docs = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .skip(offset)
      .limit(limit)
      .lean();

    return docs.map((doc) =>
      Child.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        firstName: doc.firstName,
        lastName: doc.lastName,
        birthday: doc.birthday,
        admissionDate: doc.admissionDate,
        communityHallId: doc.communityHallId?._id.toString(),
        userId: doc.userId?._id.toString(),
      }),
    );
  }

  async findAllByCommittee(committeeId: string): Promise<Child[]> {
    const committeeObjectId = new Types.ObjectId(committeeId);

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'community_halls', // nombre de la colección en la DB
          localField: 'communityHallId',
          foreignField: '_id',
          as: 'communityHall',
        },
      },
      { $unwind: '$communityHall' },
      {
        $match: {
          'communityHall.managementCommitteeId': committeeObjectId,
        },
      },
      // proyectar solo los campos del child que necesitamos
      {
        $project: {
          documentNumber: 1,
          firstName: 1,
          lastName: 1,
          birthday: 1,
          admissionDate: 1,
          communityHallId: 1,
          userId: 1,
          communityHall: 1,
        },
      },
    ];

    const docs = await this.model.aggregate(pipeline).exec();
    return docs.map((doc: any) =>
      Child.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        firstName: doc.firstName,
        lastName: doc.lastName,
        birthday: doc.birthday,
        admissionDate: doc.admissionDate,
        communityHallId: doc.communityHallId?._id.toString(),
        userId: doc.userId?._id.toString(),
        communityHall:
          typeof doc.communityHall === 'object'
            ? this.convertToCommunityHall(doc.communityHall)
            : undefined,
      }),
    );
  }

  convertToCommunityHall(raw: any): CommunityHall | undefined {
    if (!raw) return undefined;

    return new CommunityHall(
      raw.localId,
      raw.name,
      raw.managementCommitteeId._id.toString(),
      raw._id.toString(),
    );
  }
}
