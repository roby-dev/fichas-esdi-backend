import { AlertChild } from './alert-child.entity';
import { AlertSignalInterface } from './alert-signal.entity';
import { CommunityHall } from './community-hall.entity';
import { User } from './user.entity';

describe('AlertChild Entity - AlertSignals', () => {
  const user = new User(
    'rgersonzs95@gmail.com',
    'asdsadsdadsad',
    [],
    '12345678',
  );

  const baseHall = new CommunityHall(
    'HALL A',
    'committee-id-123',
    'hall-id-123',
  );

  const createAlertChild = (birthday: Date): AlertChild => {
    return AlertChild.create(
      '12345678',
      'Juan Pérez',
      'M',
      'A123',
      new Date('2024-01-01'),
      birthday,
      baseHall.id!,
      user.id!,
      baseHall,
    );
  };

  const expectSameDate = (a: Date, b: Date) => {
    expect(a.toISOString()).toBe(b.toISOString());
  };

  describe('alertSignals - Key milestones', () => {
    const birthday = new Date(Date.UTC(2023, 0, 31)); // 2023-01-31
    let signals: AlertSignalInterface;

    beforeEach(() => {
      const child = createAlertChild(birthday);
      signals = child.alertSignals;
    });

    it('should correctly calculate twoMonthSignal = birthday + 3 months - 7 days', () => {
      expectSameDate(signals.twoMonthSignal, new Date(Date.UTC(2023, 3, 23))); // Abril 23
    });

    it('should correctly calculate fourMonthSignal = birthday + 5 months - 7 days', () => {
      expectSameDate(signals.fourMonthSignal, new Date(Date.UTC(2023, 5, 23))); // Junio 23
    });

    it('should correctly calculate sixMonthSignal = birthday + 7 months - 7 days', () => {
      expectSameDate(signals.sixMonthSignal, new Date(Date.UTC(2023, 7, 24)));
    });

    it('should correctly calculate nineMonthSignal = birthday + 10 months - 7 days', () => {
      expectSameDate(signals.nineMonthSignal, new Date(Date.UTC(2023, 10, 23))); // Noviembre 23
    });

    it('should correctly calculate oneYearSignal = birthday + 12 months + 7 days', () => {
      expectSameDate(signals.oneYearSignal, new Date(Date.UTC(2024, 1, 7)));
    });

    it('should correctly calculate eighteenMonthSignal = birthday + 19 months - 7 days', () => {
      expectSameDate(
        signals.eighteenMonthSignal,
        new Date(Date.UTC(2024, 7, 24)),
      );
    });

    it('should correctly calculate twoYearSignal = birthday + 24 months + 7 days', () => {
      expectSameDate(signals.twoYearSignal, new Date(Date.UTC(2025, 1, 7)));
    });

    it('should correctly calculate threeYearSignal = birthday + 36 months + 7 days', () => {
      expectSameDate(signals.threeYearSignal, new Date(Date.UTC(2026, 1, 7)));
    });

    it('should correctly calculate raw dates like fourMonth = birthday + 5 months', () => {
      expectSameDate(signals.fourMonth, new Date(Date.UTC(2023, 5, 30))); // 31 Jan + 5 months = 30 Jun
    });

    it('should correctly cap end-of-month days', () => {
      const endMonthBirthday = new Date(Date.UTC(2022, 0, 31)); // Jan 31
      const child = createAlertChild(endMonthBirthday);
      const signal = child.alertSignals.nineMonth; // +10 months
      expect(signal.getUTCDate()).toBeLessThanOrEqual(31);
    });
  });

  describe('alertSignals - Edge case birthday: Feb 29 (leap year)', () => {
    const birthday = new Date(Date.UTC(2020, 1, 29)); // 2020-02-29
    let signals: AlertSignalInterface;

    beforeEach(() => {
      const child = createAlertChild(birthday);
      signals = child.alertSignals;
    });

    it('should handle leap year birthday gracefully in non-leap years', () => {
      expectSameDate(signals.firstBirthday, new Date(Date.UTC(2021, 1, 28))); // No Feb 29 in 2021
    });

    it('should calculate thirdBirthday on Feb 28, 2023', () => {
      expectSameDate(signals.thirdBirthday, new Date(Date.UTC(2023, 1, 28)));
    });

    it('should calculate threeYearSignal correctly with +7 days', () => {
      expectSameDate(signals.threeYearSignal, new Date(Date.UTC(2023, 2, 7)));
    });
  });

  describe('alertSignals - Different days of month', () => {
    it('should match the same day if it exists', () => {
      const birthday = new Date(Date.UTC(2022, 3, 15)); // April 15
      const child = createAlertChild(birthday);
      const twoMonth = child.alertSignals.twoMonth;
      expectSameDate(twoMonth, new Date(Date.UTC(2022, 6, 15))); // July 15
    });

    it('should clamp to end of month if day overflows', () => {
      const birthday = new Date(Date.UTC(2022, 0, 31)); // Jan 31
      const child = createAlertChild(birthday);
      const fourMonth = child.alertSignals.fourMonth;
      expectSameDate(fourMonth, new Date(Date.UTC(2022, 5, 30))); // June 30 (no 31)
    });
  });
});
