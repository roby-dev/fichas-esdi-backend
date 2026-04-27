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
import {
  AuditRecordInput,
  AuditService,
} from 'src/application/services/audit.service';

const ALERT_CHILD_ENTITY_TYPE = 'AlertChild';
const EXCEL_IMPORT_SOURCE = 'excel-import';

@Injectable()
export class UpdateChildrenFromExcelUseCase {
  private readonly logger = new Logger(UpdateChildrenFromExcelUseCase.name);

  constructor(
    @Inject(ALERT_CHILD_REPOSITORY)
    private readonly alertChildRepository: AlertChildRepository,
    @Inject(CHILD_EXCEL_READER)
    private readonly childExcelReader: ChildExcelReader,
    private readonly userContext: RequestUserContext,
    private readonly auditService: AuditService,
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
      const beforeByDocumentNumber = new Map<
        string,
        ReturnType<AlertChild['toPrimitives']>
      >();

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
          beforeByDocumentNumber.set(row.documentNumber, match.toPrimitives());
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
      const auditInputs: AuditRecordInput[] = [];

      if (toUpdate.length) {
        const result = await this.alertChildRepository.bulkUpdate(toUpdate);
        childrenResult.push(...result);

        for (const updated of result) {
          auditInputs.push({
            action: 'alert-child.update',
            entityType: ALERT_CHILD_ENTITY_TYPE,
            entityId: updated.id!,
            before:
              beforeByDocumentNumber.get(updated.documentNumber) ?? null,
            after: updated.toPrimitives(),
            metadata: { source: EXCEL_IMPORT_SOURCE },
          });
        }
      }

      if (toCreate.length) {
        const result = await this.alertChildRepository.bulkSave(toCreate);
        childrenResult.push(...result);

        for (const created of result) {
          auditInputs.push({
            action: 'alert-child.create',
            entityType: ALERT_CHILD_ENTITY_TYPE,
            entityId: created.id!,
            before: null,
            after: created.toPrimitives(),
            metadata: { source: EXCEL_IMPORT_SOURCE },
          });
        }
      }

      if (auditInputs.length) {
        await this.auditService.recordMany(auditInputs);
      }

      return childrenResult.map(AlertChildResponseDto.fromDomain);
    } catch (error) {
      this.logger.error('Error reading Excel file', error.stack);
      throw error;
    }
  }
}
