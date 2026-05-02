import {
  addUtcDays,
  isAfterOrSameUtc,
  isBeforeOrSameUtc,
  isSameUtcDate,
  nowUtc,
} from '../../common/utils/functions';

export class AlertSignal {
  constructor(private readonly birthday: Date) {}

  get alertSignals(): AlertSignalInterface {
    return {
      twoMonthSignal: this.addMonthsAndDays(3, -7),
      fourMonthSignal: this.addMonthsAndDays(5, -7),
      sixMonthSignal: this.addMonthsAndDays(7, -7),
      nineMonthSignal: this.addMonthsAndDays(10, -7),
      oneYearSignal: this.addMonthsAndDays(12, 7),
      eighteenMonthSignal: this.addMonthsAndDays(19, -7),
      twoYearSignal: this.addMonthsAndDays(24, 7),
      threeYearSignal: this.addMonthsAndDays(36, 7),

      twoMonth: this.addMonths(3),
      fourMonth: this.addMonths(5),
      sixMonth: this.addMonths(7),
      nineMonth: this.addMonths(10),
      eighteenMonth: this.addMonths(19),
      firstBirthday: this.addMonths(12),
      secondBirthday: this.addMonths(24),
      thirdBirthday: this.addMonths(36),
    };
  }

  getActiveAlertSignal(ageInMonths: number): string {
    const today = nowUtc();
    const signals = this.alertSignals;

    if (ageInMonths < 3 && isAfterOrSameUtc(today, signals.twoMonthSignal)) {
      return 'Señal de 2 meses';
    } else if (ageInMonths < 5 && isAfterOrSameUtc(today, signals.fourMonthSignal)) {
      return 'Señal de 4 meses';
    } else if (ageInMonths < 7 && isAfterOrSameUtc(today, signals.sixMonthSignal)) {
      return 'Señal de 6 meses';
    } else if (ageInMonths < 10 && isAfterOrSameUtc(today, signals.nineMonthSignal)) {
      return 'Señal de 9 meses';
    } else if (
      ageInMonths === 12 &&
      (isSameUtcDate(today, signals.firstBirthday) ||
        (today > signals.firstBirthday &&
          isBeforeOrSameUtc(today, signals.oneYearSignal)))
    ) {
      return 'Señal de 12 meses';
    } else if (
      ageInMonths < 19 &&
      isAfterOrSameUtc(today, signals.eighteenMonthSignal)
    ) {
      return 'Señal de 18 meses';
    } else if (
      ageInMonths <= 24 &&
      (isSameUtcDate(today, signals.secondBirthday) ||
        (today > signals.secondBirthday &&
          isBeforeOrSameUtc(today, signals.twoYearSignal)))
    ) {
      return 'Señal de 24 meses';
    } else if (
      ageInMonths <= 36 &&
      (isSameUtcDate(today, signals.thirdBirthday) ||
        (today > signals.thirdBirthday &&
          isBeforeOrSameUtc(today, signals.threeYearSignal)))
    ) {
      return 'Señal de 36 meses';
    }
    return '';
  }

  getAlertSignalSchedule(ageInMonths: number): string {
    const signals = this.alertSignals;

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

    if (ageInMonths < 3) {
      return `Señal de 2 meses a partir del ${formatDate(signals.twoMonthSignal)} hasta el ${formatDate(signals.twoMonth)}`;
    } else if (ageInMonths < 5) {
      return `Señal de 4 meses a partir del ${formatDate(signals.fourMonthSignal)} hasta el ${formatDate(signals.fourMonth)}`;
    } else if (ageInMonths < 7) {
      return `Señal de 6 meses a partir del ${formatDate(signals.sixMonthSignal)} hasta el ${formatDate(signals.sixMonth)}`;
    } else if (ageInMonths < 10) {
      return `Señal de 9 meses a partir del ${formatDate(signals.nineMonthSignal)} hasta el ${formatDate(signals.nineMonth)}`;
    } else if (ageInMonths === 12) {
      return `Señal de 12 meses a partir del ${formatDate(signals.firstBirthday)} hasta el ${formatDate(signals.oneYearSignal)}`;
    } else if (ageInMonths < 19) {
      return `Señal de 18 meses a partir del ${formatDate(signals.eighteenMonthSignal)} hasta el ${formatDate(signals.eighteenMonth)}`;
    } else if (ageInMonths <= 24) {
      return `Señal de 24 meses a partir del ${formatDate(signals.secondBirthday)} hasta el ${formatDate(signals.twoYearSignal)}`;
    } else if (ageInMonths <= 36) {
      return `Señal de 36 meses a partir del ${formatDate(signals.thirdBirthday)} hasta el ${formatDate(signals.threeYearSignal)}`;
    } else {
      return '';
    }
  }

  private addMonths(monthsToAdd: number): Date {
    const year = this.birthday.getUTCFullYear();
    const month = this.birthday.getUTCMonth();
    const day = this.birthday.getUTCDate();

    const newMonth = month + monthsToAdd;
    const newDate = new Date(Date.UTC(year, newMonth, 1));

    const lastDay = new Date(
      Date.UTC(newDate.getUTCFullYear(), newDate.getUTCMonth() + 1, 0),
    ).getUTCDate();

    newDate.setUTCDate(Math.min(day, lastDay));
    return newDate;
  }

  private addMonthsAndDays(months: number, days: number): Date {
    const dateWithMonths = this.addMonths(months);
    return addUtcDays(dateWithMonths, days);
  }
}

export interface AlertSignalInterface {
  twoMonthSignal: Date;
  fourMonthSignal: Date;
  sixMonthSignal: Date;
  nineMonthSignal: Date;
  oneYearSignal: Date;
  eighteenMonthSignal: Date;
  twoYearSignal: Date;
  threeYearSignal: Date;

  twoMonth: Date;
  fourMonth: Date;
  sixMonth: Date;
  nineMonth: Date;
  eighteenMonth: Date;
  firstBirthday: Date;
  secondBirthday: Date;
  thirdBirthday: Date;
}
