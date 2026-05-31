import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child as ChildSchema, ChildDocument } from '../schemas/child.schema';
import {
  ChildrenByUser,
  ChildRepository,
  UpsertChildDto,
} from 'src/domain/repositories/child.repository';
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
      fullName: child.fullName,
      birthday: child.birthday,
      admissionDate: child.admissionDate,
      birthdayImported: child.birthdayImported ?? null,
      admissionDateImported: child.admissionDateImported ?? null,
      communityHallId: child.communityHallId
        ? new Types.ObjectId(child.communityHallId)
        : null,
      communityHallLocalId: child.communityHallLocalId,
      communityHallName: child.communityHallName,
      userId: child.userId ? new Types.ObjectId(child.userId) : null,
      gender: child.gender,
      childCode: child.childCode,
      managementCommitteCode: child.managementCommitteCode,
      managementCommitteName: child.managementCommitteName,
    });

    return Child.fromPrimitives({
      id: created._id.toString(),
      documentNumber: created.documentNumber,
      firstName: created.firstName,
      lastName: created.lastName,
      fullName: created.fullName,
      birthday: created.birthday,
      admissionDate: created.admissionDate,
      birthdayImported: created.birthdayImported,
      admissionDateImported: created.admissionDateImported,
      communityHallId: (created.communityHallId as any)?._id?.toString() ??
        (created.communityHallId as any)?.toString() ?? null,
      communityHallLocalId: created.communityHallLocalId,
      communityHallName: created.communityHallName,
      userId: (created.userId as any)?._id?.toString() ??
        (created.userId as any)?.toString() ?? null,
      gender: created.gender,
      childCode: created.childCode,
      managementCommitteCode: created.managementCommitteCode,
      managementCommitteName: created.managementCommitteName,
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
          fullName: child.fullName,
          birthday: child.birthday,
          admissionDate: child.admissionDate,
          communityHallId: child.communityHallId
            ? new Types.ObjectId(child.communityHallId)
            : null,
          // Denormalized descriptors re-derived at the service layer — kept in
          // sync so a hall change also updates the committee snapshot.
          communityHallName: child.communityHallName,
          managementCommitteCode: child.managementCommitteCode,
          managementCommitteName: child.managementCommitteName,
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
      fullName: updated.fullName,
      birthday: updated.birthday,
      admissionDate: updated.admissionDate,
      communityHallId: (updated.communityHallId as any)?._id?.toString() ??
        (updated.communityHallId as any)?.toString(),
      userId: (updated.userId as any)?._id?.toString() ??
        (updated.userId as any)?.toString(),
      communityHallName: updated.communityHallName,
      gender: updated.gender,
      childCode: updated.childCode,
      managementCommitteCode: updated.managementCommitteCode,
      managementCommitteName: updated.managementCommitteName,
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

  async findAllUnpaginated(): Promise<Child[]> {
    const docs = await this.model.find().lean();
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
          'communityHall.committeeRef': committeeObjectId,
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

  async findAllByManagementCommitteCode(
    committeeCode: string,
  ): Promise<Child[]> {
    const docs = await this.model
      .find({ managementCommitteCode: committeeCode })
      .lean();

    // Full mapping: the alert-signals card consumes fullName, gender,
    // communityHallName, dates and committee descriptors, so map every field.
    return docs.map((doc) =>
      Child.fromPrimitives({
        id: doc._id.toString(),
        documentNumber: doc.documentNumber,
        firstName: doc.firstName ?? '',
        lastName: doc.lastName ?? '',
        fullName: doc.fullName,
        birthday: doc.birthday,
        admissionDate: doc.admissionDate,
        birthdayImported: doc.birthdayImported,
        admissionDateImported: doc.admissionDateImported,
        communityHallId: (doc.communityHallId as any)?._id?.toString() ??
          (doc.communityHallId as any)?.toString() ??
          null,
        communityHallLocalId: doc.communityHallLocalId,
        communityHallName: doc.communityHallName,
        userId: (doc.userId as any)?._id?.toString() ??
          (doc.userId as any)?.toString() ??
          null,
        gender: doc.gender,
        childCode: doc.childCode,
        managementCommitteCode: doc.managementCommitteCode,
        managementCommitteName: doc.managementCommitteName,
      }),
    );
  }

  async findAllGroupedByUser(): Promise<ChildrenByUser[]> {
    const pipeline: any[] = [
      {
        $group: {
          _id: '$userId',
          children: { $push: '$$ROOT' },
        },
      },
    ];

    const groups = await this.model.aggregate(pipeline).exec();
    return groups.map((group: any) => ({
      userId: group._id.toString(),
      children: group.children.map((doc: any) =>
        Child.fromPrimitives({
          id: doc._id.toString(),
          documentNumber: doc.documentNumber,
          firstName: doc.firstName,
          lastName: doc.lastName,
          birthday: doc.birthday,
          admissionDate: doc.admissionDate,
          communityHallId: doc.communityHallId?.toString(),
          userId: doc.userId?.toString(),
        }),
      ),
    }));
  }

  async upsertByDni(dto: UpsertChildDto): Promise<Child> {
    const filter = { documentNumber: dto.documentNumber };

    const setOnInsert: Record<string, unknown> = {};
    if (dto.birthday !== undefined) setOnInsert['birthday'] = dto.birthday;
    if (dto.admissionDate !== undefined)
      setOnInsert['admissionDate'] = dto.admissionDate;

    const setFields: Record<string, unknown> = {
      documentNumber: dto.documentNumber,
    };
    if (dto.firstName !== undefined) setFields['firstName'] = dto.firstName;
    if (dto.lastName !== undefined) setFields['lastName'] = dto.lastName;
    if (dto.fullName !== undefined) setFields['fullName'] = dto.fullName;
    if (dto.birthdayImported !== undefined)
      setFields['birthdayImported'] = dto.birthdayImported;
    if (dto.admissionDateImported !== undefined)
      setFields['admissionDateImported'] = dto.admissionDateImported;
    if (dto.communityHallId !== undefined)
      setFields['communityHallId'] =
        dto.communityHallId ? new Types.ObjectId(dto.communityHallId) : null;
    if (dto.communityHallLocalId !== undefined)
      setFields['communityHallLocalId'] = dto.communityHallLocalId;
    if (dto.communityHallName !== undefined)
      setFields['communityHallName'] = dto.communityHallName;
    if (dto.userId !== undefined)
      setFields['userId'] =
        dto.userId ? new Types.ObjectId(dto.userId) : null;
    if (dto.gender !== undefined) setFields['gender'] = dto.gender;
    if (dto.childCode !== undefined) setFields['childCode'] = dto.childCode;
    if (dto.managementCommitteCode !== undefined)
      setFields['managementCommitteCode'] = dto.managementCommitteCode;
    if (dto.managementCommitteName !== undefined)
      setFields['managementCommitteName'] = dto.managementCommitteName;

    const update: Record<string, unknown> = { $set: setFields };
    if (Object.keys(setOnInsert).length > 0) {
      update['$setOnInsert'] = setOnInsert;
    }

    const doc = await this.model.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    return Child.fromPrimitives({
      id: doc._id.toString(),
      documentNumber: doc.documentNumber,
      firstName: doc.firstName ?? '',
      lastName: doc.lastName ?? '',
      fullName: doc.fullName,
      birthday: doc.birthday,
      admissionDate: doc.admissionDate,
      birthdayImported: doc.birthdayImported,
      admissionDateImported: doc.admissionDateImported,
      communityHallId: (doc.communityHallId as any)?._id?.toString() ??
        (doc.communityHallId as any)?.toString() ?? null,
      communityHallLocalId: doc.communityHallLocalId,
      communityHallName: doc.communityHallName,
      userId: (doc.userId as any)?._id?.toString() ??
        (doc.userId as any)?.toString() ?? null,
      gender: doc.gender,
      childCode: doc.childCode,
      managementCommitteCode: doc.managementCommitteCode,
      managementCommitteName: doc.managementCommitteName,
    });
  }

  convertToCommunityHall(raw: any): CommunityHall | undefined {
    if (!raw) return undefined;

    const committeeRefId =
      raw.committeeRef && typeof raw.committeeRef === 'object' && raw.committeeRef._id
        ? raw.committeeRef._id.toString()
        : raw.committeeRef?.toString();

    return new CommunityHall(
      raw.localId,
      raw.name,
      committeeRefId,
      raw._id.toString(),
    );
  }
}
