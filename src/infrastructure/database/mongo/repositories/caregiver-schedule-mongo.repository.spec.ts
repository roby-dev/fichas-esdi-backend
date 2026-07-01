import { CaregiverScheduleMongoRepository } from './caregiver-schedule-mongo.repository';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';

describe('CaregiverScheduleMongoRepository', () => {
  const makeModel = (createFn: jest.Mock) => ({ create: createFn });

  const HALL_ID = '000000000000000000000002';

  const baseVersion = CaregiverScheduleVersion.create({
    communityHallId: HALL_ID,
    name: 'Default',
    validFrom: new Date('2025-01-01'),
    blocks: [
      {
        id: 'block-1',
        name: 'Morning',
        entryTime: '08:00',
        exitTime: '12:00',
        exitRequired: false,
        toleranceMinutes: 10,
        markingWindowMinutes: 30,
      },
    ],
    dayRules: [{ dayOfWeek: 1, isWorkingDay: true, blockIds: ['block-1'] }],
  });

  describe('save', () => {
    it('persists blocks and day rules as mixed data', async () => {
      const createMock = jest.fn().mockResolvedValue({
        _id: { toString: () => 'sched-1' },
        communityHallId: { toString: () => HALL_ID },
        name: 'Default',
        validFrom: new Date('2025-01-01'),
        validTo: null,
        blocks: baseVersion.blocks,
        dayRules: baseVersion.dayRules,
        specialDays: [],
      });
      const repo = new CaregiverScheduleMongoRepository(
        makeModel(createMock) as any,
      );

      await repo.save(baseVersion);

      const doc = createMock.mock.calls[0][0];
      expect(doc.communityHallId.toString()).toBe(HALL_ID);
      expect(doc.blocks).toHaveLength(1);
      expect(doc.dayRules).toHaveLength(1);
    });
  });
});
