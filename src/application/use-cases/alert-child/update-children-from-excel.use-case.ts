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
import {
  AuditRecordInput,
  AuditService,
} from 'src/application/services/audit.service';

const CHILD_ENTITY_TYPE = 'Child';
const EXCEL_IMPORT_SOURCE = 'excel-import';

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
    private readonly auditService: AuditService,
  ) {}

  async execute(
    file: Express.Multer.File,
    committeeId: string,
  ): Promise<Child[]> {
    const rows = await this.childExcelReader.read(file, committeeId);
    const now = new Date();
    const importBatchRef = file.originalname;
    const results: Child[] = [];
    const auditInputs: AuditRecordInput[] = [];

    for (const row of rows) {
      try {
        await this.processRow(row, now, importBatchRef, results, auditInputs);
      } catch (error) {
        this.logger.error(
          `Unhandled error processing row DNI=${row.documentNumber}`,
          error?.stack,
        );
      }
    }

    // Persist the per-row audit trail (insert / update / skip / save-with-warnings).
    if (auditInputs.length) {
      await this.auditService.recordMany(auditInputs);
    }

    return results;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async processRow(
    row: ChildExcelRow,
    now: Date,
    importBatchRef: string,
    results: Child[],
    auditInputs: AuditRecordInput[],
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
          importBatchRef,
          loggedAt: now,
        }),
      );
      await this.importErrorLogRepository.bulkSave(errorLogs);
      // Excluded from save → record a skip audit event (reason in `after` so the
      // event has a diff and is not suppressed by AuditService.hasDiff filtering).
      auditInputs.push({
        action: 'child.skip',
        entityType: CHILD_ENTITY_TYPE,
        entityId: row.documentNumber || 'unknown',
        before: null,
        after: {
          documentNumber: row.documentNumber ?? '',
          reason: 'INVALID_DNI',
          importBatchRef,
        },
        metadata: { source: EXCEL_IMPORT_SOURCE, importBatchRef },
      });
      return;
    }

    // 2. Resolve community hall by localId
    const hall = await this.hallRepository.findByLocalId(row.communityHallLocalId);
    if (!hall) {
      errorLogs.push(
        ImportErrorLog.create({
          errorCode: 'UNKNOWN_COMMUNITY_HALL',
          errorMessage: `Community hall localId "${row.communityHallLocalId}" not found`,
          documentNumber: normalizedDni,
          fullName: this.buildFullName(row),
          childCode: row.childCode,
          managementCommitteCode: row.managementCommitteCode,
          managementCommitteName: row.managementCommitteName,
          communityHallName: row.communityHallName,
          importBatchRef,
          loggedAt: now,
        }),
      );
      // Committee detection skipped — hall unresolved
      errorLogs.push(
        ImportErrorLog.create({
          errorCode: 'COMMITTEE_DETECTION_SKIPPED',
          errorMessage: `Committee detection skipped because hall localId "${row.communityHallLocalId}" could not be resolved`,
          documentNumber: normalizedDni,
          fullName: this.buildFullName(row),
          childCode: row.childCode,
          managementCommitteCode: row.managementCommitteCode,
          managementCommitteName: row.managementCommitteName,
          communityHallName: row.communityHallName,
          importBatchRef,
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
            importBatchRef,
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
    //    Compare the Excel row's resolved committeeId against the STORED child's
    //    committee resolved through the hall chain (decision #4):
    //    communityHallId -> community_halls.committeeRef -> committees.committeeId.
    //    NEVER read existing.managementCommitteCode directly — form-originated
    //    children don't carry it, which would flag every first import as a change.
    if (existing && hall && resolvedCommitteeId !== null) {
      const storedCommitteeId = await this.resolveStoredCommitteeId(existing);
      // Only a change when both sides resolve and differ. If the stored side
      // cannot be resolved, we cannot prove a change → do not snapshot.
      const committeeChanged =
        storedCommitteeId !== null && storedCommitteeId !== resolvedCommitteeId;

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

    // Only an EXISTING (form-authoritative) record diverts diverging Excel dates
    // to the imported fields. On a pure insert the Excel dates ARE authoritative
    // (set as primary birthday/admissionDate via $setOnInsert below) and the
    // imported fields MUST stay null (spec: "New child inserted").
    if (existing && excelBirthday) {
      const datesMatch =
        existing.birthday.getTime() === excelBirthday.getTime();
      if (!datesMatch) {
        birthdayImported = excelBirthday;
      }
    }

    if (existing && excelAdmissionDate) {
      const datesMatch =
        existing.admissionDate.getTime() === excelAdmissionDate.getTime();
      if (!datesMatch) {
        admissionDateImported = excelAdmissionDate;
      }
    }

    // 7. Build fullName from Excel row
    const fullName = this.buildFullName(row);

    // 8. Upsert — $set Excel-only fields; birthday/admissionDate go to $setOnInsert
    //    in the adapter, so they seed a new record but never overwrite the
    //    authoritative form dates of an existing one.
    const saved = await this.childRepository.upsertByDni({
      documentNumber: normalizedDni,
      fullName,
      gender: row.gender,
      childCode: row.childCode,
      managementCommitteCode: row.managementCommitteCode,
      managementCommitteName: row.managementCommitteName,
      communityHallId: hall?.id ?? null,
      communityHallLocalId: row.communityHallLocalId,
      communityHallName: row.communityHallName,
      birthday: excelBirthday ?? undefined,
      admissionDate: excelAdmissionDate ?? undefined,
      birthdayImported,
      admissionDateImported,
      userId: this.userContext.getUserId(),
    });

    results.push(saved);

    // 9. Flush error logs for this row (tolerant — save happens regardless)
    await this.importErrorLogRepository.bulkSave(errorLogs);

    // 10. Per-row audit event. A row saved with unresolved references is a
    //     save-with-warnings; otherwise it is an insert or an update depending
    //     on whether a record already existed for this DNI.
    const action =
      errorLogs.length > 0
        ? 'child.save-with-warnings'
        : existing
          ? 'child.update'
          : 'child.create';
    auditInputs.push({
      action,
      entityType: CHILD_ENTITY_TYPE,
      entityId: saved.id!,
      before: existing ? existing.toPrimitives() : null,
      after: saved.toPrimitives(),
      metadata: {
        source: EXCEL_IMPORT_SOURCE,
        importBatchRef,
        ...(errorLogs.length > 0
          ? { warnings: errorLogs.map((log) => log.errorCode) }
          : {}),
      },
    });
  }

  /**
   * Resolve a stored child's committeeId through the hall chain:
   * communityHallId -> community_halls.committeeRef -> committees.committeeId.
   * Returns null when any link in the chain cannot be resolved (e.g. the child
   * has no communityHallId, the hall was deleted, or the committee is missing),
   * which signals that a committee change cannot be reliably determined.
   */
  private async resolveStoredCommitteeId(existing: Child): Promise<string | null> {
    if (!existing.communityHallId) {
      return null;
    }
    const hall = await this.hallRepository.findById(existing.communityHallId);
    if (!hall) {
      return null;
    }
    const committee = await this.committeeRepository.findById(hall.committeeRef);
    return committee?.committeeId ?? null;
  }

  private buildFullName(row: ChildExcelRow): string {
    return `${row.childNames ?? ''} ${row.fatherLastName ?? ''} ${row.motherLastName ?? ''}`.trim();
  }
}
