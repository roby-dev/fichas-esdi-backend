import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChildHistory as ChildHistorySchema,
  ChildHistoryDocument,
} from '../schemas/child-history.schema';
import { ChildHistoryRepository } from 'src/domain/repositories/child-history.repository';
import { ChildHistory } from 'src/domain/entities/child-history.entity';

@Injectable()
export class ChildHistoryMongoRepository implements ChildHistoryRepository {
  constructor(
    @InjectModel(ChildHistorySchema.name)
    private readonly model: Model<ChildHistoryDocument>,
  ) {}

  async save(snapshot: ChildHistory): Promise<void> {
    await this.model.create({
      originalId: new Types.ObjectId(snapshot.originalId),
      documentNumber: snapshot.documentNumber,
      firstName: snapshot.firstName,
      lastName: snapshot.lastName,
      fullName: snapshot.fullName,
      birthday: snapshot.birthday,
      admissionDate: snapshot.admissionDate,
      birthdayImported: snapshot.birthdayImported ?? null,
      admissionDateImported: snapshot.admissionDateImported ?? null,
      communityHallId: snapshot.communityHallId
        ? new Types.ObjectId(snapshot.communityHallId)
        : null,
      communityHallLocalId: snapshot.communityHallLocalId,
      communityHallName: snapshot.communityHallName,
      userId: snapshot.userId ? new Types.ObjectId(snapshot.userId) : null,
      gender: snapshot.gender,
      childCode: snapshot.childCode,
      managementCommitteCode: snapshot.managementCommitteCode,
      managementCommitteName: snapshot.managementCommitteName,
      snapshotDate: snapshot.snapshotDate,
      reason: snapshot.reason,
    });
  }
}
