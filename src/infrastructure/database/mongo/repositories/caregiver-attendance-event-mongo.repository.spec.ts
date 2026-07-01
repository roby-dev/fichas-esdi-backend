import { CaregiverAttendanceEventMongoRepository } from './caregiver-attendance-event-mongo.repository';
import { CaregiverAttendanceEvent } from 'src/domain/entities/caregiver-attendance-event.entity';

describe('CaregiverAttendanceEventMongoRepository', () => {
  const makeModel = (createFn: jest.Mock) => ({ create: createFn });

  const CGV_ID = '000000000000000000000001';
  const HALL_ID = '000000000000000000000002';

  const baseEvent = CaregiverAttendanceEvent.create({
    caregiverId: CGV_ID,
    communityHallId: HALL_ID,
    localDate: '2025-01-06',
    blockId: 'block-1',
    reason: 'out_of_window',
    source: 'self-service',
  });

  describe('save', () => {
    it('persists a self-service rejection event', async () => {
      const createMock = jest.fn().mockResolvedValue({
        _id: { toString: () => 'evt-1' },
        caregiverId: { toString: () => CGV_ID },
        communityHallId: { toString: () => HALL_ID },
        localDate: '2025-01-06',
        blockId: 'block-1',
        reason: 'out_of_window',
        source: 'self-service',
        recordedAt: new Date(),
      });
      const repo = new CaregiverAttendanceEventMongoRepository(
        makeModel(createMock) as any,
      );

      await repo.save(baseEvent);

      const doc = createMock.mock.calls[0][0];
      expect(doc.reason).toBe('out_of_window');
      expect(doc.source).toBe('self-service');
      expect(doc.caregiverId.toString()).toBe(CGV_ID);
    });
  });
});
