// application/use-cases/update-children-from-excel.usecase.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';
import {
  ALERT_CHILD_REPOSITORY,
  CHILD_EXCEL_READER,
  MANAGEMENT_COMMITTEE_REPOSITORY,
} from 'src/domain/constants/tokens';
import { RequestUserContext } from 'src/common/context/user-context.service';
import { ChildExcelRow } from 'src/application/interfaces/child-excel-row.interface';
import type { ChildExcelReader } from 'src/application/interfaces/child-excel-reader.interface';
import type { AlertChildRepository } from 'src/domain/repositories/alert-child.repository';
import { AlertChild } from 'src/domain/entities/alert-child.entity';
import { parseDdMmYyyyToUtcDate } from 'src/common/utils/functions';

@Injectable()
export class UpdateChildrenFromExcelUseCase {
  private readonly logger = new Logger(UpdateChildrenFromExcelUseCase.name);

  constructor(
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly managementCommitteRepository: ManagementCommitteeRepository,
    @Inject(ALERT_CHILD_REPOSITORY)
    private readonly alertChildRepository: AlertChildRepository,
    @Inject(CHILD_EXCEL_READER)
    private readonly childExcelReader: ChildExcelReader,
    private readonly userContext: RequestUserContext,
  ) {}

  async execute(
    file: Express.Multer.File,
    limit = 10,
    offset = 0,
  ): Promise<void> {
    try {
      const committees =
        await this.managementCommitteRepository.findAllByUserId(
          this.userContext.getUserId(),
          limit,
          offset,
        );

      const allowedCommitteeIds = committees.map((c) => String(c.committeeId));
      const rows = await this.childExcelReader.read(file, allowedCommitteeIds);

      // 1. Obtener registros existentes
      const existing =
        await this.alertChildRepository.findAllByUserId(this.userContext.getUserId());

     console.log(existing[0], rows[0]);

      const toUpdate: AlertChild[] = [];
      const toCreate: AlertChild[] = [];

      for (const row of rows) {
        const match = existing.find(
          (e) =>
            e.documentNumber === row.documentNumber &&
            e.communityHallId === row.localId,
        );

        console.log(match);

        const entityData = {
          documentNumber: row.documentNumber,
          fullName: `${row.childNames} ${row.fatherLastName} ${row.motherLastName}`,
          gender: row.gender,
          childCode: row.childCode,
          admissionDate: parseDdMmYyyyToUtcDate(row.admissionDate),
          birthday: parseDdMmYyyyToUtcDate(row.birthday),
          communityHallId: row.localId,
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
              entityData.communityHallId,
              entityData.userId,
              undefined,
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
              entityData.communityHallId,
              entityData.userId,
            ),
          );
        }
      }

      // 4. Guardar cambios
      if (toUpdate.length) {
        await this.alertChildRepository.bulkUpdate(toUpdate);
      }
      if (toCreate.length) {
        await this.alertChildRepository.bulkSave(toCreate);
      }
    } catch (error) {
      this.logger.error('Error reading Excel file', error.stack);
      throw error;
    }
  }
}
