import { nowUtc } from '../../common/utils/functions';
import { CommunityHall } from './community-hall.entity';
import { AlertSignal, AlertSignalInterface } from './alert-signal.entity';

export class AlertChild {
  constructor(
    private readonly _documentNumber: string,
    private readonly _fullName: string,
    private readonly _gender: string,
    private readonly _childCode: string,
    private readonly _admissionDate: Date,
    private readonly _birthday: Date,
    private readonly _communityHallId: string,
    private readonly _userId: string,
    private readonly _id?: string,
    private readonly _communityHall?: CommunityHall,
  ) {}

  get documentNumber(): string {
    return this._documentNumber;
  }

  get fullName(): string {
    return this._fullName;
  }

  get gender(): string {
    return this._gender;
  }

  get childCode(): string {
    return this._childCode;
  }

  get admissionDate(): Date {
    return this._admissionDate;
  }

  get birthday(): Date {
    return this._birthday;
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

  static create(
    documentNumber: string,
    fullName: string,
    gender: string,
    childCode: string,
    admissionDate: Date,
    birthday: Date,
    communityHallId: string,
    userId: string,
    communityHall?: CommunityHall,
    id?: string,
  ): AlertChild {
    return new AlertChild(
      documentNumber,
      fullName,
      gender,
      childCode,
      admissionDate,
      birthday,
      communityHallId,
      userId,
      id,
      communityHall,
    );
  }

  static fromPrimitives(data: {
    id?: string;
    documentNumber: string;
    fullName: string;
    gender: string;
    childCode: string;
    admissionDate: Date;
    birthday: Date;
    communityHallId: string;
    userId: string;
    communityHall?: CommunityHall;
  }): AlertChild {
    return new AlertChild(
      data.documentNumber,
      data.fullName,
      data.gender,
      data.childCode,
      data.admissionDate,
      data.birthday,
      data.communityHallId,
      data.userId,
      data.id,
      data.communityHall,
    );
  }

  toPrimitives(): {
    id?: string;
    documentNumber: string;
    fullName: string;
    gender: string;
    childCode: string;
    admissionDate: Date;
    birthday: Date;
    communityHallId: string;
    userId: string;
    communityHall?: ReturnType<CommunityHall['toPrimitives']>;
  } {
    return {
      id: this._id,
      documentNumber: this._documentNumber,
      fullName: this._fullName,
      gender: this._gender,
      childCode: this._childCode,
      admissionDate: this._admissionDate,
      birthday: this._birthday,
      communityHallId: this._communityHallId,
      userId: this._userId,
      communityHall: this._communityHall?.toPrimitives(),
    };
  }
}
