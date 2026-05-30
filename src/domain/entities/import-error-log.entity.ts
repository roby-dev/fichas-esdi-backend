/**
 * ImportErrorLog — an append-only record of every row saved during an Excel
 * import that contained an unresolved reference or invalid data.
 *
 * Error codes:
 *   UNKNOWN_COMMUNITY_HALL    — communityHallId did not match any community_halls.localId
 *   UNRESOLVED_COMMITTEE_CODE — managementCommitteCode did not match any committees.committeeId
 *   COMMITTEE_DETECTION_SKIPPED — detection skipped because communityHallId could not be resolved
 *   INVALID_DNI               — documentNumber could not be normalized to /^\d{8}$/
 *
 * toPrimitives() returns a `type`-based plain object so it satisfies
 * `Record<string, unknown>` (same convention as ChildPrimitives / ChildHistoryPrimitives).
 */

export type ImportErrorCode =
  | 'UNKNOWN_COMMUNITY_HALL'
  | 'UNRESOLVED_COMMITTEE_CODE'
  | 'COMMITTEE_DETECTION_SKIPPED'
  | 'INVALID_DNI';

export type ImportErrorLogPrimitives = {
  id?: string;
  errorCode: ImportErrorCode;
  errorMessage: string;
  documentNumber: string;
  fullName?: string;
  childCode?: string;
  managementCommitteCode?: string;
  managementCommitteName?: string;
  communityHallId?: string;
  communityHallName?: string;
  importBatchRef?: string;
  loggedAt: Date;
};

export class ImportErrorLog {
  constructor(
    private readonly _errorCode: ImportErrorCode,
    private readonly _errorMessage: string,
    private readonly _documentNumber: string,
    private readonly _loggedAt: Date,
    private readonly _id?: string,
    private readonly _fullName?: string,
    private readonly _childCode?: string,
    private readonly _managementCommitteCode?: string,
    private readonly _managementCommitteName?: string,
    private readonly _communityHallId?: string,
    private readonly _communityHallName?: string,
    private readonly _importBatchRef?: string,
  ) {}

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string | undefined {
    return this._id;
  }

  get errorCode(): ImportErrorCode {
    return this._errorCode;
  }

  get errorMessage(): string {
    return this._errorMessage;
  }

  get documentNumber(): string {
    return this._documentNumber;
  }

  get loggedAt(): Date {
    return this._loggedAt;
  }

  get fullName(): string | undefined {
    return this._fullName;
  }

  get childCode(): string | undefined {
    return this._childCode;
  }

  get managementCommitteCode(): string | undefined {
    return this._managementCommitteCode;
  }

  get managementCommitteName(): string | undefined {
    return this._managementCommitteName;
  }

  get communityHallId(): string | undefined {
    return this._communityHallId;
  }

  get communityHallName(): string | undefined {
    return this._communityHallName;
  }

  get importBatchRef(): string | undefined {
    return this._importBatchRef;
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(data: Omit<ImportErrorLogPrimitives, 'id'>): ImportErrorLog {
    return new ImportErrorLog(
      data.errorCode,
      data.errorMessage,
      data.documentNumber,
      data.loggedAt,
      undefined,
      data.fullName,
      data.childCode,
      data.managementCommitteCode,
      data.managementCommitteName,
      data.communityHallId,
      data.communityHallName,
      data.importBatchRef,
    );
  }

  static fromPrimitives(data: ImportErrorLogPrimitives): ImportErrorLog {
    return new ImportErrorLog(
      data.errorCode,
      data.errorMessage,
      data.documentNumber,
      data.loggedAt,
      data.id,
      data.fullName,
      data.childCode,
      data.managementCommitteCode,
      data.managementCommitteName,
      data.communityHallId,
      data.communityHallName,
      data.importBatchRef,
    );
  }

  toPrimitives(): ImportErrorLogPrimitives {
    return {
      id: this._id,
      errorCode: this._errorCode,
      errorMessage: this._errorMessage,
      documentNumber: this._documentNumber,
      fullName: this._fullName,
      childCode: this._childCode,
      managementCommitteCode: this._managementCommitteCode,
      managementCommitteName: this._managementCommitteName,
      communityHallId: this._communityHallId,
      communityHallName: this._communityHallName,
      importBatchRef: this._importBatchRef,
      loggedAt: this._loggedAt,
    };
  }
}
