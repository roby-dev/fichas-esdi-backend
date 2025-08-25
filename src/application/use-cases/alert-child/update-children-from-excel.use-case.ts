// application/use-cases/update-children-from-excel.usecase.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALERT_CHILD_REPOSITORY,
  CHILD_EXCEL_READER,
} from 'src/domain/constants/tokens';
import type { ChildExcelReader } from 'src/application/interfaces/child-excel-reader.interface';
import type { AlertChildRepository } from 'src/domain/repositories/alert-child.repository';
import { AlertChild } from 'src/domain/entities/alert-child.entity';
import { parseDdMmYyyyToUtcDate } from 'src/common/utils/functions';
import { AlertChildResponseDto } from 'src/application/dtos/alert-child/alert-child-response.dto';
import { BulkUpdateDto } from 'src/application/dtos/alert-child/bulk-update.dto';
import { RequestUserContext } from 'src/common/contexts/user-context.service';

@Injectable()
export class UpdateChildrenFromExcelUseCase {
  private readonly logger = new Logger(UpdateChildrenFromExcelUseCase.name);

  constructor(
    @Inject(ALERT_CHILD_REPOSITORY)
    private readonly alertChildRepository: AlertChildRepository,
    @Inject(CHILD_EXCEL_READER)
    private readonly childExcelReader: ChildExcelReader,
    private readonly userContext: RequestUserContext,
  ) {}

  async execute(
    dto: BulkUpdateDto,
    limit = 10,
    offset = 0,
  ): Promise<AlertChildResponseDto[]> {
    try {
      const rows = await this.childExcelReader.read(dto.file, dto.committeeId);

      const existing = await this.alertChildRepository.findAllByUserId(
        this.userContext.getUserId(),
      );

      const toUpdate: AlertChild[] = [];
      const toCreate: AlertChild[] = [];

      for (const row of rows) {
        const match = existing.find(
          (e) => e.documentNumber === row.documentNumber,
        );

        const entityData = {
          documentNumber: row.documentNumber,
          fullName: `${row.childNames} ${row.fatherLastName} ${row.motherLastName}`,
          gender: row.gender,
          childCode: row.childCode,
          admissionDate: parseDdMmYyyyToUtcDate(row.admissionDate),
          birthday: parseDdMmYyyyToUtcDate(row.birthday),
          managementCommitteName: row.managementCommitteName,
          managementCommitteCode: row.managementCommitteCode,
          communityHallName: row.communityHallName,
          communityHallId: row.communityHallId,
          userId: this.userContext.getUserId(),
        };

        if (match) {
          toUpdate.push(
            AlertChild.create(
              entityData.documentNumber,
              entityData.fullName,
              entityData.gender,
              entityData.childCode,
              entityData.admissionDate,
              entityData.birthday,
              entityData.managementCommitteName,
              entityData.managementCommitteCode,
              entityData.communityHallName,
              entityData.communityHallId,
              entityData.userId,
              match.id,
            ),
          );
        } else {
          toCreate.push(
            AlertChild.create(
              entityData.documentNumber,
              entityData.fullName,
              entityData.gender,
              entityData.childCode,
              entityData.admissionDate,
              entityData.birthday,
              entityData.managementCommitteName,
              entityData.managementCommitteCode,
              entityData.communityHallName,
              entityData.communityHallId,
              entityData.userId,
            ),
          );
        }
      }

      const childrenResult: AlertChild[] = [];

      if (toUpdate.length) {
        const result = await this.alertChildRepository.bulkUpdate(toUpdate);
        childrenResult.push(...result);
      }
      if (toCreate.length) {
        const result = await this.alertChildRepository.bulkSave(toCreate);
        childrenResult.push(...result);
      }

      return childrenResult.map(AlertChildResponseDto.fromDomain);
    } catch (error) {
      this.logger.error('Error reading Excel file', error.stack);
      throw error;
    }
  }
}
