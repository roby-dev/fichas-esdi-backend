import { CaregiverAttendanceExceptionMongoRepository } from './caregiver-attendance-exception-mongo.repository';
import { CaregiverAttendanceException } from 'src/domain/entities/caregiver-attendance-exception.entity';

describe('CaregiverAttendanceExceptionMongoRepository', () => {
  const makeModel = (createFn: jest.Mock) => ({ create: createFn });

  const HALL_ID = '000000000000000000000002';

  const baseException = CaregiverAttendanceException.hallHoliday({
    communityHallId: HALL_ID,
    localDate: '2025-01-06',
    reason: 'National holiday',
  });

  describe('save', () => {
    it('persists a hall-level exception', async () => {
      const createMock = jest.fn().mockResolvedValue({
        _id: { toString: () => 'exc-1' },
        scope: 'hall',
        communityHallId: { toString: () => HALL_ID },
        localDate: '2025-01-06',
        kind: 'holiday',
        status: 'accepted',
        reason: 'National holiday',
      });
      const repo = new CaregiverAttendanceExceptionMongoRepository(
        makeModel(createMock) as any,
      );

      await repo.save(baseException);

      const doc = createMock.mock.calls[0][0];
      expect(doc.scope).toBe('hall');
      expect(doc.communityHallId.toString()).toBe(HALL_ID);
      expect(doc.kind).toBe('holiday');
    });
  });
});
