/**
 * ChildHistory — an append-only snapshot of a child's active record,
 * captured immediately before a committee change is applied.
 *
 * toPrimitives() returns a `type`-based plain object (not an interface)
 * so it satisfies `Record<string, unknown>` when used as AuditEventSnapshot.
 */

export type ChildHistoryPrimitives = {
  id?: string;
  originalId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  birthday: Date;
  admissionDate: Date;
  birthdayImported?: Date | null;
  admissionDateImported?: Date | null;
  communityHallId?: string | null;
  communityHallLocalId?: string;
  communityHallName?: string;
  userId?: string | null;
  gender?: string;
  childCode?: string;
  managementCommitteCode?: string;
  managementCommitteName?: string;
  snapshotDate: Date;
  reason: string;
};

export class ChildHistory {
  constructor(
    private readonly _originalId: string,
    private readonly _documentNumber: string,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _birthday: Date,
    private readonly _admissionDate: Date,
    private readonly _snapshotDate: Date,
    private readonly _reason: string,
    private readonly _id?: string,
    private readonly _fullName?: string,
    private readonly _birthdayImported?: Date | null,
    private readonly _admissionDateImported?: Date | null,
    private readonly _communityHallId?: string | null,
    private readonly _communityHallLocalId?: string,
    private readonly _communityHallName?: string,
    private readonly _userId?: string | null,
    private readonly _gender?: string,
    private readonly _childCode?: string,
    private readonly _managementCommitteCode?: string,
    private readonly _managementCommitteName?: string,
  ) {}

  // ── Getters ────────────────────────────────────────────────────────────────

  get id(): string | undefined {
    return this._id;
  }

  get originalId(): string {
    return this._originalId;
  }

  get documentNumber(): string {
    return this._documentNumber;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string | undefined {
    return this._fullName;
  }

  get birthday(): Date {
    return this._birthday;
  }

  get admissionDate(): Date {
    return this._admissionDate;
  }

  get birthdayImported(): Date | null | undefined {
    return this._birthdayImported;
  }

  get admissionDateImported(): Date | null | undefined {
    return this._admissionDateImported;
  }

  get communityHallId(): string | null | undefined {
    return this._communityHallId;
  }

  get communityHallLocalId(): string | undefined {
    return this._communityHallLocalId;
  }

  get communityHallName(): string | undefined {
    return this._communityHallName;
  }

  get userId(): string | null | undefined {
    return this._userId;
  }

  get gender(): string | undefined {
    return this._gender;
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

  get snapshotDate(): Date {
    return this._snapshotDate;
  }

  get reason(): string {
    return this._reason;
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  static create(data: Omit<ChildHistoryPrimitives, 'id'>): ChildHistory {
    return new ChildHistory(
      data.originalId,
      data.documentNumber,
      data.firstName,
      data.lastName,
      data.birthday,
      data.admissionDate,
      data.snapshotDate,
      data.reason,
      undefined,
      data.fullName,
      data.birthdayImported,
      data.admissionDateImported,
      data.communityHallId,
      data.communityHallLocalId,
      data.communityHallName,
      data.userId,
      data.gender,
      data.childCode,
      data.managementCommitteCode,
      data.managementCommitteName,
    );
  }

  static fromPrimitives(data: ChildHistoryPrimitives): ChildHistory {
    return new ChildHistory(
      data.originalId,
      data.documentNumber,
      data.firstName,
      data.lastName,
      data.birthday,
      data.admissionDate,
      data.snapshotDate,
      data.reason,
      data.id,
      data.fullName,
      data.birthdayImported,
      data.admissionDateImported,
      data.communityHallId,
      data.communityHallLocalId,
      data.communityHallName,
      data.userId,
      data.gender,
      data.childCode,
      data.managementCommitteCode,
      data.managementCommitteName,
    );
  }

  toPrimitives(): ChildHistoryPrimitives {
    return {
      id: this._id,
      originalId: this._originalId,
      documentNumber: this._documentNumber,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this._fullName,
      birthday: this._birthday,
      admissionDate: this._admissionDate,
      birthdayImported: this._birthdayImported,
      admissionDateImported: this._admissionDateImported,
      communityHallId: this._communityHallId,
      communityHallLocalId: this._communityHallLocalId,
      communityHallName: this._communityHallName,
      userId: this._userId,
      gender: this._gender,
      childCode: this._childCode,
      managementCommitteCode: this._managementCommitteCode,
      managementCommitteName: this._managementCommitteName,
      snapshotDate: this._snapshotDate,
      reason: this._reason,
    };
  }
}
