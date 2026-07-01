import { v4 as uuidv4 } from 'uuid';
import { nowUtc } from 'src/common/utils/functions';

export type CaregiverAttendanceExceptionKind =
  | 'holiday'
  | 'day_off'
  | 'permission'
  | 'justification';

export type CaregiverAttendanceExceptionScope = 'hall' | 'caregiver';

export type CaregiverAttendanceExceptionStatus = 'accepted' | 'pending';

export type CaregiverAttendanceExceptionPrimitives = {
  id?: string;
  scope: CaregiverAttendanceExceptionScope;
  communityHallId?: string;
  caregiverId?: string;
  localDate: string; // YYYY-MM-DD
  blockId?: string;
  kind: CaregiverAttendanceExceptionKind;
  status: CaregiverAttendanceExceptionStatus;
  reason: string;
  requestedBy?: string;
  createdAt: Date;
};

export class CaregiverAttendanceException {
  constructor(
    private readonly _scope: CaregiverAttendanceExceptionScope,
    private readonly _localDate: string,
    private readonly _kind: CaregiverAttendanceExceptionKind,
    private readonly _status: CaregiverAttendanceExceptionStatus,
    private readonly _reason: string,
    private readonly _communityHallId?: string,
    private readonly _caregiverId?: string,
    private readonly _blockId?: string,
    private readonly _requestedBy?: string,
    private readonly _createdAt: Date = nowUtc(),
    private readonly _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get scope(): CaregiverAttendanceExceptionScope {
    return this._scope;
  }

  get communityHallId(): string | undefined {
    return this._communityHallId;
  }

  get caregiverId(): string | undefined {
    return this._caregiverId;
  }

  get localDate(): string {
    return this._localDate;
  }

  get blockId(): string | undefined {
    return this._blockId;
  }

  get kind(): CaregiverAttendanceExceptionKind {
    return this._kind;
  }

  get status(): CaregiverAttendanceExceptionStatus {
    return this._status;
  }

  get reason(): string {
    return this._reason;
  }

  get requestedBy(): string | undefined {
    return this._requestedBy;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  isAccepted(): boolean {
    return this._status === 'accepted';
  }

  appliesToHallDate(hallId: string, localDate: string): boolean {
    return (
      this._scope === 'hall' &&
      this._communityHallId === hallId &&
      this._localDate === localDate &&
      this._status === 'accepted'
    );
  }

  appliesToCaregiverBlock(
    caregiverId: string,
    localDate: string,
    blockId: string,
  ): boolean {
    return (
      this._scope === 'caregiver' &&
      this._caregiverId === caregiverId &&
      this._localDate === localDate &&
      (this._blockId === undefined || this._blockId === blockId) &&
      this._status === 'accepted'
    );
  }

  static hallHoliday(input: {
    communityHallId: string;
    localDate: string;
    reason: string;
    requestedBy?: string;
    status?: CaregiverAttendanceExceptionStatus;
  }): CaregiverAttendanceException {
    return new CaregiverAttendanceException(
      'hall',
      input.localDate,
      'holiday',
      input.status ?? 'accepted',
      input.reason,
      input.communityHallId,
      undefined,
      undefined,
      input.requestedBy,
      nowUtc(),
      uuidv4(),
    );
  }

  static hallDayOff(input: {
    communityHallId: string;
    localDate: string;
    reason: string;
    requestedBy?: string;
    status?: CaregiverAttendanceExceptionStatus;
  }): CaregiverAttendanceException {
    return new CaregiverAttendanceException(
      'hall',
      input.localDate,
      'day_off',
      input.status ?? 'accepted',
      input.reason,
      input.communityHallId,
      undefined,
      undefined,
      input.requestedBy,
      nowUtc(),
      uuidv4(),
    );
  }

  static caregiverJustification(input: {
    caregiverId: string;
    localDate: string;
    blockId?: string;
    reason: string;
    requestedBy?: string;
    status?: CaregiverAttendanceExceptionStatus;
  }): CaregiverAttendanceException {
    return new CaregiverAttendanceException(
      'caregiver',
      input.localDate,
      'justification',
      input.status ?? 'accepted',
      input.reason,
      undefined,
      input.caregiverId,
      input.blockId,
      input.requestedBy,
      nowUtc(),
      uuidv4(),
    );
  }

  static fromPrimitives(
    data: CaregiverAttendanceExceptionPrimitives,
  ): CaregiverAttendanceException {
    return new CaregiverAttendanceException(
      data.scope,
      data.localDate,
      data.kind,
      data.status,
      data.reason,
      data.communityHallId,
      data.caregiverId,
      data.blockId,
      data.requestedBy,
      data.createdAt,
      data.id,
    );
  }

  toPrimitives(): CaregiverAttendanceExceptionPrimitives {
    return {
      id: this._id,
      scope: this._scope,
      communityHallId: this._communityHallId,
      caregiverId: this._caregiverId,
      localDate: this._localDate,
      blockId: this._blockId,
      kind: this._kind,
      status: this._status,
      reason: this._reason,
      requestedBy: this._requestedBy,
      createdAt: this._createdAt,
    };
  }
}
