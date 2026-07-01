import { v4 as uuidv4 } from 'uuid';
import { nowUtc } from 'src/common/utils/functions';

export type CaregiverAttendanceMarkKind = 'official' | 'special' | 'corrected';

export type CaregiverAttendanceRecordPrimitives = {
  id?: string;
  caregiverId: string;
  communityHallId: string;
  localDate: string; // YYYY-MM-DD
  blockId: string;
  markKind: CaregiverAttendanceMarkKind;
  entryTime?: string; // HH:mm
  exitTime?: string | null; // HH:mm
  source: string;
  reason?: string;
  performerId?: string;
  isVoided: boolean;
  voidedAt?: Date | null;
  correctedFromId?: string | null;
  recordedAt: Date;
  metadata?: Record<string, unknown>;
};

export class CaregiverAttendanceRecord {
  constructor(
    private readonly _caregiverId: string,
    private readonly _communityHallId: string,
    private readonly _localDate: string,
    private readonly _blockId: string,
    private readonly _markKind: CaregiverAttendanceMarkKind,
    private readonly _source: string,
    private readonly _recordedAt: Date,
    private readonly _entryTime?: string,
    private readonly _exitTime?: string | null,
    private readonly _reason?: string,
    private readonly _performerId?: string,
    private readonly _isVoided = false,
    private readonly _voidedAt?: Date | null,
    private readonly _correctedFromId?: string | null,
    private readonly _metadata?: Record<string, unknown>,
    private readonly _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get caregiverId(): string {
    return this._caregiverId;
  }

  get communityHallId(): string {
    return this._communityHallId;
  }

  get localDate(): string {
    return this._localDate;
  }

  get blockId(): string {
    return this._blockId;
  }

  get markKind(): CaregiverAttendanceMarkKind {
    return this._markKind;
  }

  get entryTime(): string | undefined {
    return this._entryTime;
  }

  get exitTime(): string | null | undefined {
    return this._exitTime;
  }

  get source(): string {
    return this._source;
  }

  get reason(): string | undefined {
    return this._reason;
  }

  get performerId(): string | undefined {
    return this._performerId;
  }

  get isVoided(): boolean {
    return this._isVoided;
  }

  get voidedAt(): Date | null | undefined {
    return this._voidedAt;
  }

  get correctedFromId(): string | null | undefined {
    return this._correctedFromId;
  }

  get recordedAt(): Date {
    return this._recordedAt;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata;
  }

  void(): CaregiverAttendanceRecord {
    return new CaregiverAttendanceRecord(
      this._caregiverId,
      this._communityHallId,
      this._localDate,
      this._blockId,
      this._markKind,
      this._source,
      this._recordedAt,
      this._entryTime,
      this._exitTime,
      this._reason,
      this._performerId,
      true,
      nowUtc(),
      this._correctedFromId,
      this._metadata,
      this._id,
    );
  }

  static createOfficial(input: {
    caregiverId: string;
    communityHallId: string;
    localDate: string;
    blockId: string;
    entryTime: string;
    source: string;
    metadata?: Record<string, unknown>;
  }): CaregiverAttendanceRecord {
    return new CaregiverAttendanceRecord(
      input.caregiverId,
      input.communityHallId,
      input.localDate,
      input.blockId,
      'official',
      input.source,
      nowUtc(),
      input.entryTime,
      null,
      undefined,
      undefined,
      false,
      null,
      null,
      input.metadata,
      uuidv4(),
    );
  }

  static createSpecial(input: {
    caregiverId: string;
    communityHallId: string;
    localDate: string;
    blockId: string;
    entryTime?: string;
    source: string;
    reason: string;
    performerId: string;
    metadata?: Record<string, unknown>;
  }): CaregiverAttendanceRecord {
    return new CaregiverAttendanceRecord(
      input.caregiverId,
      input.communityHallId,
      input.localDate,
      input.blockId,
      'special',
      input.source,
      nowUtc(),
      input.entryTime,
      null,
      input.reason,
      input.performerId,
      false,
      null,
      null,
      input.metadata,
      uuidv4(),
    );
  }

  static createCorrection(input: {
    original: CaregiverAttendanceRecord;
    newEntryTime: string;
    reason: string;
    performerId: string;
  }): CaregiverAttendanceRecord {
    return new CaregiverAttendanceRecord(
      input.original._caregiverId,
      input.original._communityHallId,
      input.original._localDate,
      input.original._blockId,
      'corrected',
      'correction',
      nowUtc(),
      input.newEntryTime,
      input.original._exitTime,
      input.reason,
      input.performerId,
      false,
      null,
      input.original._id ?? null,
      input.original._metadata,
      uuidv4(),
    );
  }

  static fromPrimitives(
    data: CaregiverAttendanceRecordPrimitives,
  ): CaregiverAttendanceRecord {
    return new CaregiverAttendanceRecord(
      data.caregiverId,
      data.communityHallId,
      data.localDate,
      data.blockId,
      data.markKind,
      data.source,
      data.recordedAt,
      data.entryTime,
      data.exitTime,
      data.reason,
      data.performerId,
      data.isVoided,
      data.voidedAt,
      data.correctedFromId,
      data.metadata,
      data.id,
    );
  }

  toPrimitives(): CaregiverAttendanceRecordPrimitives {
    return {
      id: this._id,
      caregiverId: this._caregiverId,
      communityHallId: this._communityHallId,
      localDate: this._localDate,
      blockId: this._blockId,
      markKind: this._markKind,
      entryTime: this._entryTime,
      exitTime: this._exitTime,
      source: this._source,
      reason: this._reason,
      performerId: this._performerId,
      isVoided: this._isVoided,
      voidedAt: this._voidedAt,
      correctedFromId: this._correctedFromId,
      recordedAt: this._recordedAt,
      metadata: this._metadata,
    };
  }
}
