import {
  isAfterOrSameUtc,
  isBeforeOrSameUtc,
  isSameUtcDate,
  nowUtc,
} from '../../common/utils/functions';
import { AlertSignal, AlertSignalInterface } from './alert-signal.entity';

export class AlertChild {
  constructor(
    private readonly _documentNumber: string,
    private readonly _fullName: string,
    private readonly _gender: string,
    private readonly _childCode: string,
    private readonly _admissionDate: Date,
    private readonly _birthday: Date,
    private readonly _managementCommitteName: string,
    private readonly _managementCommitteCode: string,
    private readonly _communityHallName: string,
    private readonly _communityHallId: string,
    private readonly _userId: string,
    private readonly _id?: string,
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

  get managementCommitteName(): string {
    return this._managementCommitteName;
  }

  get managementCommitteCode(): string {
    return this._managementCommitteCode;
  }

  get communityHallName(): string {
    return this._communityHallName;
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
    const today = nowUtc();
    const age = this.ageInMonths;
    const signals = this.alertSignals;

    if (age < 3 && isAfterOrSameUtc(today, signals.twoMonthSignal)) {
      return 'Señal de 2 meses';
    } else if (age < 5 && isAfterOrSameUtc(today, signals.fourMonthSignal)) {
      return 'Señal de 4 meses';
    } else if (age < 7 && isAfterOrSameUtc(today, signals.sixMonthSignal)) {
      return 'Señal de 6 meses';
    } else if (age < 10 && isAfterOrSameUtc(today, signals.nineMonthSignal)) {
      return 'Señal de 9 meses';
    } else if (
      age === 12 &&
      (isSameUtcDate(today, signals.firstBirthday) ||
        (today > signals.firstBirthday &&
          isBeforeOrSameUtc(today, signals.oneYearSignal)))
    ) {
      return 'Señal de 12 meses';
    } else if (
      age < 19 &&
      isAfterOrSameUtc(today, signals.eighteenMonthSignal)
    ) {
      return 'Señal de 18 meses';
    } else if (
      age <= 24 &&
      (isSameUtcDate(today, signals.secondBirthday) ||
        (today > signals.secondBirthday &&
          isBeforeOrSameUtc(today, signals.twoYearSignal)))
    ) {
      return 'Señal de 24 meses';
    } else if (
      age <= 36 &&
      (isSameUtcDate(today, signals.thirdBirthday) ||
        (today > signals.thirdBirthday &&
          isBeforeOrSameUtc(today, signals.threeYearSignal)))
    ) {
      return 'Señal de 36 meses';
    }
    return '';
  }

  get alertSignalSchedule(): string {
    const alertSignals = this.alertSignals;
    const myAge = this.ageInMonths;

    const formatDate = (date: Date) =>
      date
        .toLocaleDateString('es-ES', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        })
        .replace(/,/g, '');

    if (myAge < 3) {
      return `Señal de 2 meses a partir del ${formatDate(alertSignals.twoMonthSignal)} hasta el ${formatDate(alertSignals.twoMonth)}`;
    } else if (myAge < 5) {
      return `Señal de 4 meses a partir del ${formatDate(alertSignals.fourMonthSignal)} hasta el ${formatDate(alertSignals.fourMonth)}`;
    } else if (myAge < 7) {
      return `Señal de 6 meses a partir del ${formatDate(alertSignals.sixMonthSignal)} hasta el ${formatDate(alertSignals.sixMonth)}`;
    } else if (myAge < 10) {
      return `Señal de 9 meses a partir del ${formatDate(alertSignals.nineMonthSignal)} hasta el ${formatDate(alertSignals.nineMonth)}`;
    } else if (myAge === 12) {
      return `Señal de 12 meses a partir del ${formatDate(alertSignals.firstBirthday)} hasta el ${formatDate(alertSignals.oneYearSignal)}`;
    } else if (myAge < 19) {
      return `Señal de 18 meses a partir del ${formatDate(alertSignals.eighteenMonthSignal)} hasta el ${formatDate(alertSignals.eighteenMonth)}`;
    } else if (myAge <= 24) {
      return `Señal de 24 meses a partir del ${formatDate(alertSignals.secondBirthday)} hasta el ${formatDate(alertSignals.twoYearSignal)}`;
    } else if (myAge <= 36) {
      return `Señal de 36 meses a partir del ${formatDate(alertSignals.thirdBirthday)} hasta el ${formatDate(alertSignals.threeYearSignal)}`;
    } else {
      return '';
    }
  }

  static create(
    documentNumber: string,
    fullName: string,
    gender: string,
    childCode: string,
    admissionDate: Date,
    birthday: Date,
    managementCommitteName: string,
    managementCommitteCode: string,
    communityHallName: string,
    communityHallId: string,
    userId: string,
    id?: string,
  ): AlertChild {
    return new AlertChild(
      documentNumber,
      fullName,
      gender,
      childCode,
      admissionDate,
      birthday,
      managementCommitteName,
      managementCommitteCode,
      communityHallName,
      communityHallId,
      userId,
      id,
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
    managementCommitteName: string;
    managementCommitteCode: string;
    communityHallName: string;
    communityHallId: string;
    userId: string;
  }): AlertChild {
    return new AlertChild(
      data.documentNumber,
      data.fullName,
      data.gender,
      data.childCode,
      data.admissionDate,
      data.birthday,
      data.managementCommitteName,
      data.managementCommitteCode,
      data.communityHallName,
      data.communityHallId,
      data.userId,
      data.id,
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
    managementCommitteName: string;
    managementCommitteCode: string;
    communityHallName: string;
    communityHallId: string;
    userId: string;
  } {
    return {
      id: this._id,
      documentNumber: this._documentNumber,
      fullName: this._fullName,
      gender: this._gender,
      childCode: this._childCode,
      admissionDate: this._admissionDate,
      birthday: this._birthday,
      managementCommitteName: this._managementCommitteName,
      managementCommitteCode: this._managementCommitteCode,
      communityHallName: this._communityHallName,
      communityHallId: this._communityHallId,
      userId: this._userId,
    };
  }
}
