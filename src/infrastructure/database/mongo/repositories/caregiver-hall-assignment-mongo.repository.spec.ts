import { CaregiverHallAssignmentMongoRepository } from './caregiver-hall-assignment-mongo.repository';
import { CaregiverHallAssignment } from 'src/domain/entities/caregiver-hall-assignment.entity';

describe('CaregiverHallAssignmentMongoRepository', () => {
  const makeModel = (createFn: jest.Mock) => ({ create: createFn });

  const CGV_ID = '000000000000000000000001';
  const HALL_ID = '000000000000000000000002';

  const baseAssignment = CaregiverHallAssignment.create({
    caregiverId: CGV_ID,
    communityHallId: HALL_ID,
    validFrom: new Date('2025-01-01'),
  });

  describe('save', () => {
    it('persists an assignment with ObjectId references', async () => {
      const createMock = jest.fn().mockResolvedValue({
        _id: { toString: () => 'assign-1' },
        caregiverId: { toString: () => CGV_ID },
        communityHallId: { toString: () => HALL_ID },
        validFrom: new Date('2025-01-01'),
        validTo: null,
      });
      const repo = new CaregiverHallAssignmentMongoRepository(
        makeModel(createMock) as any,
      );

      await repo.save(baseAssignment);

      const doc = createMock.mock.calls[0][0];
      expect(doc.caregiverId.toString()).toBe(CGV_ID);
      expect(doc.communityHallId.toString()).toBe(HALL_ID);
      expect(doc.validTo).toBeNull();
    });
  });
});
