export type CaregiverMotherStatus = 'active' | 'retired';

export type CaregiverMotherPrimitives = {
  id?: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  startDate: Date;
  endDate?: Date | null;
  status: CaregiverMotherStatus;
};

export type CreateCaregiverMotherInput = {
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  phone?: string;
  startDate: Date;
  endDate?: Date | null;
  status?: CaregiverMotherStatus;
};

export class CaregiverMother {
  constructor(
    private readonly _documentType: string,
    private readonly _documentNumber: string,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _phone: string | undefined,
    private readonly _startDate: Date,
    private readonly _endDate: Date | null | undefined,
    private readonly _status: CaregiverMotherStatus,
    private readonly _id?: string,
    private readonly _fullName?: string,
  ) {}

  get id(): string | undefined {
    return this._id;
  }

  get documentType(): string {
    return this._documentType;
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

  get fullName(): string {
    return (
      this._fullName ??
      `${(this._firstName ?? '').trim()} ${(this._lastName ?? '').trim()}`
        .trim()
        .toUpperCase()
    );
  }

  get phone(): string | undefined {
    return this._phone;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | null | undefined {
    return this._endDate;
  }

  get status(): CaregiverMotherStatus {
    return this._status;
  }

  get identityKey(): string {
    return `${this._documentType}:${this._documentNumber}`;
  }

  isActiveOn(date: Date): boolean {
    if (this._status !== 'active') return false;
    const time = date.getTime();
    if (time < this._startDate.getTime()) return false;
    if (this._endDate && time > this._endDate.getTime()) return false;
    return true;
  }

  static create(input: CreateCaregiverMotherInput): CaregiverMother {
    return new CaregiverMother(
      input.documentType.trim().toUpperCase(),
      input.documentNumber.trim(),
      input.firstName.trim().toUpperCase(),
      input.lastName.trim().toUpperCase(),
      input.phone?.trim(),
      input.startDate,
      input.endDate ?? null,
      input.status ?? 'active',
    );
  }

  static fromPrimitives(data: CaregiverMotherPrimitives): CaregiverMother {
    return new CaregiverMother(
      data.documentType,
      data.documentNumber,
      data.firstName,
      data.lastName,
      data.phone,
      data.startDate,
      data.endDate ?? null,
      data.status,
      data.id,
      data.fullName,
    );
  }

  toPrimitives(): CaregiverMotherPrimitives {
    return {
      id: this._id,
      documentType: this._documentType,
      documentNumber: this._documentNumber,
      firstName: this._firstName,
      lastName: this._lastName,
      fullName: this.fullName,
      phone: this._phone,
      startDate: this._startDate,
      endDate: this._endDate,
      status: this._status,
    };
  }
}
