import { v4 as uuidv4 } from 'uuid';
import { nowUtc } from 'src/common/utils/functions';

export type CaregiverAttendanceEventSource =
  | 'self-service'
  | 'assisted'
  | 'system';

export type CaregiverAttendanceEventPrimitives = {
  id?: string;
  caregiverId?: string;
  communityHallId?: string;
  localDate: string; // YYYY-MM-DD
  blockId?: string;
  reason: string;
  source: CaregiverAttendanceEventSource;
  metadata?: Record<string, unknown>;
  recordedAt: Date;
};

export class CaregiverAttendanceEvent {
  constructor(
    private readonly _localDate: string,
    private readonly _reason: string,
    private readonly _source: CaregiverAttendanceEventSource,
    private readonly _recordedAt: Date,
    private readonly _caregiverId?: string,
    private readonly _communityHallId?: string,
    private readonly _blockId?: string,
    private readonly _metadata?: Record<string, unknown>,
    private readonly _id?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get caregiverId(): string | undefined {
    return this._caregiverId;
  }

  get communityHallId(): string | undefined {
    return this._communityHallId;
  }

  get localDate(): string {
    return this._localDate;
  }

  get blockId(): string | undefined {
    return this._blockId;
  }

  get reason(): string {
    return this._reason;
  }

  get source(): CaregiverAttendanceEventSource {
    return this._source;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this._metadata;
  }

  get recordedAt(): Date {
    return this._recordedAt;
  }

  static create(input: {
    localDate: string;
    reason: string;
    source: CaregiverAttendanceEventSource;
    caregiverId?: string;
    communityHallId?: string;
    blockId?: string;
    metadata?: Record<string, unknown>;
  }): CaregiverAttendanceEvent {
    return new CaregiverAttendanceEvent(
      input.localDate,
      input.reason,
      input.source,
      nowUtc(),
      input.caregiverId,
      input.communityHallId,
      input.blockId,
      input.metadata,
      uuidv4(),
    );
  }

  static fromPrimitives(
    data: CaregiverAttendanceEventPrimitives,
  ): CaregiverAttendanceEvent {
    return new CaregiverAttendanceEvent(
      data.localDate,
      data.reason,
      data.source,
      data.recordedAt,
      data.caregiverId,
      data.communityHallId,
      data.blockId,
      data.metadata,
      data.id,
    );
  }

  toPrimitives(): CaregiverAttendanceEventPrimitives {
    return {
      id: this._id,
      caregiverId: this._caregiverId,
      communityHallId: this._communityHallId,
      localDate: this._localDate,
      blockId: this._blockId,
      reason: this._reason,
      source: this._source,
      metadata: this._metadata,
      recordedAt: this._recordedAt,
    };
  }
}
