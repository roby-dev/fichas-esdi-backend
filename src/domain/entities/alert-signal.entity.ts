import { addUtcDays } from '../../common/utils/functions';

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

  private addMonths(monthsToAdd: number): Date {
    const year = this.birthday.getUTCFullYear();
    const month = this.birthday.getUTCMonth();
    const day = this.birthday.getUTCDate();

    const newMonth = month + monthsToAdd;
    const newDate = new Date(Date.UTC(year, newMonth, 1));

    const lastDay = new Date(
      Date.UTC(newDate.getUTCFullYear(), newDate.getUTCMonth() + 1, 0)
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
