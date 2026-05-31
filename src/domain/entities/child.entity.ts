import { addUtcDays, nowUtc } from '../../common/utils/functions';
import { CommunityHall } from './community-hall.entity';
import { AlertSignal, AlertSignalInterface } from './alert-signal.entity';

export type ChildPrimitives = {
  id?: string;
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
  communityHall?: ReturnType<CommunityHall['toPrimitives']>;
}

export class Child {
  constructor(
    private readonly _documentNumber: string,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _birthday: Date,
    private readonly _admissionDate: Date,
    private readonly _communityHallId: string | null | undefined,
    private readonly _userId: string | null | undefined,
    private readonly _id?: string,
    private readonly _communityHall?: CommunityHall,
    private readonly _fullName?: string,
    private readonly _birthdayImported?: Date | null,
    private readonly _admissionDateImported?: Date | null,
    private readonly _communityHallLocalId?: string,
    private readonly _communityHallName?: string,
    private readonly _gender?: string,
    private readonly _childCode?: string,
    private readonly _managementCommitteCode?: string,
    private readonly _managementCommitteName?: string,
  ) {}

  // ── Getters ────────────────────────────────────────────────────────────────

  get documentNumber(): string {
    return this._documentNumber;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  /** Concatenation of firstName and lastName — set at persistence or provided from Excel */
  get fullName(): string {
    return (
      this._fullName ??
      `${this._firstName.trim()} ${this._lastName.trim()}`.trim()
    );
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

  get id(): string | undefined {
    return this._id;
  }

  get communityHall(): CommunityHall | undefined {
    return this._communityHall;
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

  // ── Computed ───────────────────────────────────────────────────────────────

  get admissionValidFrom(): Date {
    return addUtcDays(this._admissionDate, 19);
  }

  get admissionValidUntil(): Date {
    return addUtcDays(this._admissionDate, 40);
  }

  get graduationDate(): Date {
    const year = this._birthday.getUTCFullYear();
    const month = this._birthday.getUTCMonth() + 35;
    const day = this._birthday.getUTCDate();

    const graduation = new Date(Date.UTC(year, month, 1));

    const lastDayOfMonth = new Date(
      Date.UTC(graduation.getUTCFullYear(), graduation.getUTCMonth() + 1, 0),
    ).getUTCDate();

    graduation.setUTCDate(day > lastDayOfMonth ? lastDayOfMonth : day);

    return graduation;
  }

  get isCurrentlyAdmitted(): boolean {
    const today = nowUtc();
    return (
      today >= this.admissionValidFrom && today <= this.admissionValidUntil
    );
  }

  get isGraduated(): boolean {
    const today = nowUtc();
    return today >= this.graduationDate;
  }

  get ageInMonths(): number {
    const today = nowUtc();
    const years = today.getUTCFullYear() - this._birthday.getUTCFullYear();
    const months = today.getUTCMonth() - this._birthday.getUTCMonth();
    const totalMonths = years * 12 + months;

    if (today.getUTCDate() < this._birthday.getUTCDate()) {
      return totalMonths - 1;
    }

    return totalMonths;
  }

  get alertSignals(): AlertSignalInterface {
    return new AlertSignal(this._birthday).alertSignals;
  }

  get activeAlertSignal(): string {
    return new AlertSignal(this._birthday).getActiveAlertSignal(this.ageInMonths);
  }

  get alertSignalSchedule(): string {
    return new AlertSignal(this._birthday).getAlertSignalSchedule(
      this.ageInMonths,
    );
  }

  // ── Factory ────────────────────────────────────────────────────────────────

  /**
   * Create a form-originated child (firstName + lastName required).
   * communityHallId and userId are required for form-originated children.
   *
   * `derived` carries the denormalized hall/committee descriptors resolved at
   * the service layer (communityHallName, managementCommitteCode/Name). They are
   * stored so form children share the same shape as Excel-imported children and
   * can be queried by committee code without a join.
   */
  static create(
    documentNumber: string,
    firstName: string,
    lastName: string,
    birthday: Date,
    admissionDate: Date,
    communityHallId: string,
    userId: string,
    communityHall?: CommunityHall,
    derived?: {
      communityHallName?: string;
      managementCommitteCode?: string;
      managementCommitteName?: string;
    },
  ): Child {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    return new Child(
      documentNumber,
      firstName,
      lastName,
      birthday,
      admissionDate,
      communityHallId,
      userId,
      undefined,
      communityHall,
      fullName,
      null,
      null,
      undefined,
      derived?.communityHallName,
      undefined,
      undefined,
      derived?.managementCommitteCode,
      derived?.managementCommitteName,
    );
  }

  static fromPrimitives(data: ChildPrimitives): Child {
    return new Child(
      data.documentNumber,
      data.firstName,
      data.lastName,
      data.birthday,
      data.admissionDate,
      data.communityHallId,
      data.userId,
      data.id,
      data.communityHall
        ? CommunityHall.fromPrimitives(data.communityHall as any)
        : undefined,
      data.fullName,
      data.birthdayImported,
      data.admissionDateImported,
      data.communityHallLocalId,
      data.communityHallName,
      data.gender,
      data.childCode,
      data.managementCommitteCode,
      data.managementCommitteName,
    );
  }

  toPrimitives(): ChildPrimitives {
    return {
      id: this._id,
      documentNumber: this._documentNumber,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
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
      communityHall: this._communityHall?.toPrimitives(),
    };
  }
}
