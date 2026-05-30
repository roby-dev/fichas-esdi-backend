import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ImportErrorLog as ImportErrorLogSchema,
  ImportErrorLogDocument,
} from '../schemas/import-error-log.schema';
import { ImportErrorLogRepository } from 'src/domain/repositories/import-error-log.repository';
import { ImportErrorLog } from 'src/domain/entities/import-error-log.entity';

@Injectable()
export class ImportErrorLogMongoRepository implements ImportErrorLogRepository {
  constructor(
    @InjectModel(ImportErrorLogSchema.name)
    private readonly model: Model<ImportErrorLogDocument>,
  ) {}

  async bulkSave(logs: ImportErrorLog[]): Promise<void> {
    if (logs.length === 0) return;

    const docs = logs.map((log) => ({
      errorCode: log.errorCode,
      errorMessage: log.errorMessage,
      documentNumber: log.documentNumber,
      fullName: log.fullName,
      childCode: log.childCode,
      managementCommitteCode: log.managementCommitteCode,
      managementCommitteName: log.managementCommitteName,
      communityHallId: log.communityHallId,
      communityHallName: log.communityHallName,
      importBatchRef: log.importBatchRef,
      loggedAt: log.loggedAt,
    }));

    await this.model.insertMany(docs);
  }
}
