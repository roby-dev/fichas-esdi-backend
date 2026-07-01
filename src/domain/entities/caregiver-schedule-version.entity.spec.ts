import { CaregiverScheduleVersion } from './caregiver-schedule-version.entity';

describe('CaregiverScheduleVersion Entity', () => {
  const baseBlock = {
    id: 'block-1',
    name: 'Morning',
    entryTime: '08:00',
    exitTime: '12:00',
    exitRequired: false,
    toleranceMinutes: 10,
    markingWindowMinutes: 30,
  };

  const baseDayRules = [
    { dayOfWeek: 1, isWorkingDay: true, blockIds: ['block-1'] },
    { dayOfWeek: 2, isWorkingDay: true, blockIds: ['block-1'] },
    { dayOfWeek: 0, isWorkingDay: false, blockIds: [] },
  ];

  const createVersion = (overrides?: {
    validFrom?: Date;
    validTo?: Date | null;
    dayRules?: typeof baseDayRules;
  }) =>
    CaregiverScheduleVersion.create({
      communityHallId: 'hall-1',
      name: 'Default',
      validFrom: overrides?.validFrom ?? new Date('2025-01-01'),
      validTo: overrides?.validTo,
      blocks: [baseBlock],
      dayRules: overrides?.dayRules ?? baseDayRules,
    });

  describe('create', () => {
    it('generates ids for blocks when omitted', () => {
      const version = CaregiverScheduleVersion.create({
        communityHallId: 'hall-1',
        name: 'Default',
        validFrom: new Date('2025-01-01'),
        blocks: [
          {
            name: 'Morning',
            entryTime: '08:00',
            exitTime: '12:00',
            exitRequired: false,
            toleranceMinutes: 10,
            markingWindowMinutes: 30,
          },
        ],
        dayRules: baseDayRules,
      });

      expect(version.blocks[0].id).toBeDefined();
      expect(version.blocks[0].id).toHaveLength(36);
    });
  });

  describe('activeOn', () => {
    it('is active when date is within validity range', () => {
      const version = createVersion({
        validFrom: new Date('2025-01-01'),
        validTo: new Date('2025-06-30'),
      });

      expect(version.activeOn(new Date('2025-03-15'))).toBe(true);
      expect(version.activeOn(new Date('2024-12-31'))).toBe(false);
      expect(version.activeOn(new Date('2025-07-01'))).toBe(false);
    });
  });

  describe('isWorkingDay', () => {
    it('returns true for configured working days', () => {
      const version = createVersion();

      expect(version.isWorkingDay(new Date('2025-01-06'))).toBe(true); // Monday
      expect(version.isWorkingDay(new Date('2025-01-05'))).toBe(false); // Sunday
    });

    it('honors special day overrides', () => {
      const version = createVersion({
        dayRules: baseDayRules,
      }).withSpecialDay({
        localDate: '2025-01-06',
        isWorkingDay: false,
        blockIds: [],
      });

      expect(version.isWorkingDay(new Date('2025-01-06'))).toBe(false);
    });
  });

  describe('blocksForDate', () => {
    it('returns blocks scheduled for a working day', () => {
      const version = createVersion();

      const blocks = version.blocksForDate(new Date('2025-01-06'));

      expect(blocks).toHaveLength(1);
      expect(blocks[0].id).toBe('block-1');
    });

    it('returns empty array for non-working days', () => {
      const version = createVersion();

      expect(version.blocksForDate(new Date('2025-01-05'))).toEqual([]);
    });
  });

  describe('evaluateMark', () => {
    it('accepts an on-time mark within tolerance', () => {
      const version = createVersion();

      const result = version.evaluateMark('block-1', '08:05');

      expect(result.status).toBe('on_time');
    });

    it('accepts a tardy mark within the marking window', () => {
      const version = createVersion();

      const result = version.evaluateMark('block-1', '08:15');

      expect(result.status).toBe('tardy');
    });

    it('rejects a mark outside the marking window', () => {
      const version = createVersion();

      const result = version.evaluateMark('block-1', '08:35');

      expect(result.status).toBe('out_of_window');
    });
  });

  describe('copyToHall', () => {
    it('returns an independent version for another hall', () => {
      const version = createVersion();

      const copy = version.copyToHall({
        communityHallId: 'hall-2',
        validFrom: new Date('2025-07-01'),
        name: 'Copied',
      });

      expect(copy.communityHallId).toBe('hall-2');
      expect(copy.name).toBe('Copied');
      expect(copy.blocks).toHaveLength(1);
      expect(copy.blocks[0].id).not.toBe(version.blocks[0].id);
    });
  });
});
