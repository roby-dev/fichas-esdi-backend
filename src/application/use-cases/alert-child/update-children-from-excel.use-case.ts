/**
 * UpdateChildrenFromExcelUseCase — Phase 3 rewrite.
 *
 * Merges Excel rows into the unified `children` collection keyed by
 * normalized DNI. Implements:
 *   - Tolerant import: unresolved refs still save the child, errors logged
 *   - Non-destructive date merge: form dates are authoritative
 *   - Committee-change detection: snapshot to children_history before update
 *   - INVALID_DNI rows are excluded from save but always logged
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CHILD_EXCEL_READER,
  CHILD_HISTORY_REPOSITORY,
  CHILD_REPOSITORY,
  COMMITTEE_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
  IMPORT_ERROR_LOG_REPOSITORY,
} from 'src/domain/constants/tokens';
import type { ChildExcelReader } from 'src/application/interfaces/child-excel-reader.interface';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import type { ChildHistoryRepository } from 'src/domain/repositories/child-history.repository';
import type { ImportErrorLogRepository } from 'src/domain/repositories/import-error-log.repository';
import { ChildHistory } from 'src/domain/entities/child-history.entity';
import {
  ImportErrorLog,
  ImportErrorCode,
} from 'src/domain/entities/import-error-log.entity';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { parseDdMmYyyyToUtcDate } from 'src/common/utils/functions';
import { normalizeDni } from 'src/common/utils/dni';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { ChildExcelRow } from 'src/application/interfaces/child-excel-row.interface';

@Injectable()
export class UpdateChildrenFromExcelUseCase {
  private readonly logger = new Logger(UpdateChildrenFromExcelUseCase.name);

  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly childRepository: ChildRepository,
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly hallRepository: CommunityHallRepository,
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
    @Inject(CHILD_HISTORY_REPOSITORY)
    private readonly childHistoryRepository: ChildHistoryRepository,
    @Inject(IMPORT_ERROR_LOG_REPOSITORY)
    private readonly importErrorLogRepository: ImportErrorLogRepository,
    @Inject(CHILD_EXCEL_READER)
    private readonly childExcelReader: ChildExcelReader,
    private readonly userContext: RequestUserContext,
  ) {}

  async execute(
    file: Express.Multer.File,
    committeeId: string,
  ): Promise<Child[]> {
    const rows = await this.childExcelReader.read(file, committeeId);
    const now = new Date();
    const results: Child[] = [];

    for (const row of rows) {
      try {
        await this.processRow(row, now, results);
      } catch (error) {
        this.logger.error(
          `Unhandled error processing row DNI=${row.documentNumber}`,
          error?.stack,
        );
      }
    }

    return results;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async processRow(
    row: ChildExcelRow,
    now: Date,
    results: Child[],
  ): Promise<void> {
    const errorLogs: ImportErrorLog[] = [];

    // 1. Normalize DNI — invalid rows are excluded from save
    const normalizedDni = normalizeDni(row.documentNumber);
    if (!normalizedDni) {
      errorLogs.push(
        ImportErrorLog.create({
          errorCode: 'INVALID_DNI',
          errorMessage: `DNI "${row.documentNumber}" could not be normalized to 8 digits`,
          documentNumber: row.documentNumber ?? '',
          fullName: this.buildFullName(row),
          childCode: row.childCode,
          managementCommitteCode: row.managementCommitteCode,
          managementCommitteName: row.managementCommitteName,
          communityHallName: row.communityHallName,
          loggedAt: now,
        }),
      );
      await this.importErrorLogRepository.bulkSave(errorLogs);
      return;
    }

    // 2. Resolve community hall by localId
    const hall = await this.hallRepository.findByLocalId(row.communityHallId);
    if (!hall) {
      errorLogs.push(
        ImportErrorLog.create({
          errorCode: 'UNKNOWN_COMMUNITY_HALL',
          errorMessage: `Community hall localId "${row.communityHallId}" not found`,
          documentNumber: normalizedDni,
          fullName: this.buildFullName(row),
          childCode: row.childCode,
          managementCommitteCode: row.managementCommitteCode,
          managementCommitteName: row.managementCommitteName,
          communityHallName: row.communityHallName,
          loggedAt: now,
        }),
      );
      // Committee detection skipped — hall unresolved
      errorLogs.push(
        ImportErrorLog.create({
          errorCode: 'COMMITTEE_DETECTION_SKIPPED',
          errorMessage: `Committee detection skipped because hall localId "${row.communityHallId}" could not be resolved`,
          documentNumber: normalizedDni,
          fullName: this.buildFullName(row),
          childCode: row.childCode,
          managementCommitteCode: row.managementCommitteCode,
          managementCommitteName: row.managementCommitteName,
          communityHallName: row.communityHallName,
          loggedAt: now,
        }),
      );
    }

    // 3. Resolve committee (only when hall is found)
    let resolvedCommitteeId: string | null = null;
    if (hall) {
      const committee = await this.committeeRepository.findByCommitteeId(
        row.managementCommitteCode,
      );
      if (!committee) {
        errorLogs.push(
          ImportErrorLog.create({
            errorCode: 'UNRESOLVED_COMMITTEE_CODE',
            errorMessage: `Committee code "${row.managementCommitteCode}" not found`,
            documentNumber: normalizedDni,
            fullName: this.buildFullName(row),
            childCode: row.childCode,
            managementCommitteCode: row.managementCommitteCode,
            managementCommitteName: row.managementCommitteName,
            communityHallId: hall.id,
            communityHallName: row.communityHallName,
            loggedAt: now,
          }),
        );
      } else {
        resolvedCommitteeId = committee.committeeId;
      }
    }

    // 4. Load existing child (for committee-change detection + date merge)
    const existing = await this.childRepository.findByDocumentNumber(
      normalizedDni,
    );

    // 5. Committee-change detection
    if (existing && hall && resolvedCommitteeId !== null) {
      const storedCommitteeCode = existing.managementCommitteCode ?? null;
      const committeeChanged = storedCommitteeCode !== resolvedCommitteeId;

      if (committeeChanged) {
        // Snapshot BEFORE update (two-step, no transaction — orphan snapshots accepted)
        const snapshot = ChildHistory.create({
          originalId: existing.id!,
          documentNumber: existing.documentNumber,
          firstName: existing.firstName,
          lastName: existing.lastName,
          fullName: existing.fullName,
          birthday: existing.birthday,
          admissionDate: existing.admissionDate,
          birthdayImported: existing.birthdayImported ?? null,
          admissionDateImported: existing.admissionDateImported ?? null,
          communityHallId: existing.communityHallId ?? null,
          communityHallLocalId: existing.communityHallLocalId,
          communityHallName: existing.communityHallName,
          userId: existing.userId ?? null,
          gender: existing.gender,
          childCode: existing.childCode,
          managementCommitteCode: existing.managementCommitteCode,
          managementCommitteName: existing.managementCommitteName,
          snapshotDate: new Date(),
          reason: 'committee_change',
        });
        await this.childHistoryRepository.save(snapshot);
      }
    }

    // 6. Non-destructive date merge
    //    Form dates (birthday / admissionDate) are authoritative — never overwrite.
    //    Diverging Excel dates go to birthdayImported / admissionDateImported.
    const excelBirthday = row.birthday
      ? parseDdMmYyyyToUtcDate(row.birthday)
      : null;
    const excelAdmissionDate = row.admissionDate
      ? parseDdMmYyyyToUtcDate(row.admissionDate)
      : null;

    let birthdayImported: Date | null = existing?.birthdayImported ?? null;
    let admissionDateImported: Date | null =
      existing?.admissionDateImported ?? null;

    if (existing && excelBirthday) {
      const datesMatch =
        existing.birthday.getTime() === excelBirthday.getTime();
      if (!datesMatch) {
        birthdayImported = excelBirthday;
      }
    } else if (!existing && excelBirthday) {
      // New child — no form birthday on record yet; store Excel date as imported
      birthdayImported = excelBirthday;
    }

    if (existing && excelAdmissionDate) {
      const datesMatch =
        existing.admissionDate.getTime() === excelAdmissionDate.getTime();
      if (!datesMatch) {
        admissionDateImported = excelAdmissionDate;
      }
    } else if (!existing && excelAdmissionDate) {
      admissionDateImported = excelAdmissionDate;
    }

    // 7. Build fullName from Excel row
    const fullName = this.buildFullName(row);

    // 8. Upsert — $set Excel-only fields; $setOnInsert form-originated fields handled by adapter
    const saved = await this.childRepository.upsertByDni({
      documentNumber: normalizedDni,
      fullName,
      gender: row.gender,
      childCode: row.childCode,
      managementCommitteCode: row.managementCommitteCode,
      managementCommitteName: row.managementCommitteName,
      communityHallId: hall?.id ?? null,
      communityHallLocalId: row.communityHallId,
      communityHallName: row.communityHallName,
      birthdayImported,
      admissionDateImported,
      userId: this.userContext.getUserId(),
    });

    results.push(saved);

    // 9. Flush error logs for this row (tolerant — save happens regardless)
    await this.importErrorLogRepository.bulkSave(errorLogs);
  }

  private buildFullName(row: ChildExcelRow): string {
    return `${row.childNames ?? ''} ${row.fatherLastName ?? ''} ${row.motherLastName ?? ''}`.trim();
  }
}
