import { CaregiverAttendanceMongoRepository } from './caregiver-attendance-mongo.repository';
import { CaregiverAttendanceRecord } from 'src/domain/entities/caregiver-attendance-record.entity';

describe('CaregiverAttendanceMongoRepository', () => {
  const makeModel = (createFn: jest.Mock) => ({ create: createFn });

  const CGV_ID = '000000000000000000000001';
  const HALL_ID = '000000000000000000000002';

  const baseRecord = CaregiverAttendanceRecord.createOfficial({
    caregiverId: CGV_ID,
    communityHallId: HALL_ID,
    localDate: '2025-01-06',
    blockId: 'block-1',
    entryTime: '08:05',
    source: 'self-service',
  });

  describe('save', () => {
    it('persists an official mark with the correct kind', async () => {
      const createMock = jest.fn().mockResolvedValue({
        _id: { toString: () => 'mark-1' },
        caregiverId: { toString: () => CGV_ID },
        communityHallId: { toString: () => HALL_ID },
        localDate: '2025-01-06',
        blockId: 'block-1',
        markKind: 'official',
        entryTime: '08:05',
        source: 'self-service',
        isVoided: false,
        recordedAt: new Date('2025-01-06T08:05:00.000Z'),
      });
      const repo = new CaregiverAttendanceMongoRepository(
        makeModel(createMock) as any,
      );

      await repo.save(baseRecord);

      const doc = createMock.mock.calls[0][0];
      expect(doc.markKind).toBe('official');
      expect(doc.isVoided).toBe(false);
      expect(doc.localDate).toBe('2025-01-06');
    });
  });
});
