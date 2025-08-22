import { addUtcDays, nowUtc } from '../../common/utils/functions';
import { CommunityHall } from './community-hall.entity';

export class Child {
  constructor(
    private readonly _documentNumber: string,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _birthday: Date,
    private readonly _admissionDate: Date,
    private readonly _communityHallId: string,
    private readonly _userId: string,
    private readonly _id?: string,
    private readonly _communityHall?: CommunityHall,
  ) {}

  get documentNumber(): string {
    return this._documentNumber;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get birthday(): Date {
    return this._birthday;
  }

  get admissionDate(): Date {
    return this._admissionDate;
  }

  get communityHallId(): string {
    return this._communityHallId;
  }

  get userId(): string {
    return this._userId;
  }

  get id(): string | undefined {
    return this._id;
  }

  get communityHall(): CommunityHall | undefined {
    return this._communityHall;
  }

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

  static create(
    documentNumber: string,
    firstName: string,
    lastName: string,
    birthday: Date,
    admissionDate: Date,
    communityHallId: string,
    userId: string,
    communityHall?: CommunityHall,
  ): Child {
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
    );
  }

  static fromPrimitives(data: {
    id?: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    birthday: Date;
    admissionDate: Date;
    communityHallId: string;
    userId: string;
    communityHall?: CommunityHall;
  }): Child {
    return new Child(
      data.documentNumber,
      data.firstName,
      data.lastName,
      data.birthday,
      data.admissionDate,
      data.communityHallId,
      data.userId,
      data.id,
      data.communityHall,
    );
  }

  toPrimitives(): {
    id?: string;
    documentNumber: string;
    firstName: string;
    lastName: string;
    birthday: Date;
    admissionDate: Date;
    communityHallId: string;
    userId: string;
    communityHall?: ReturnType<CommunityHall['toPrimitives']>;
  } {
    return {
      id: this._id,
      documentNumber: this._documentNumber,
      firstName: this._firstName,
      lastName: this._lastName,
      birthday: this._birthday,
      admissionDate: this._admissionDate,
      communityHallId: this._communityHallId,
      userId: this.userId,
      communityHall: this._communityHall?.toPrimitives(),
    };
  }
}
