import { CaregiverHallAssignmentMongoRepository } from './caregiver-hall-assignment-mongo.repository';
import { CaregiverHallAssignment } from 'src/domain/entities/caregiver-hall-assignment.entity';

describe('CaregiverHallAssignmentMongoRepository', () => {
  const makeModel = (overrides: Record<string, unknown>) => overrides;

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
        makeModel({ create: createMock }) as any,
      );

      await repo.save(baseAssignment);

      const doc = createMock.mock.calls[0][0];
      expect(doc.caregiverId.toString()).toBe(CGV_ID);
      expect(doc.communityHallId.toString()).toBe(HALL_ID);
      expect(doc.validTo).toBeNull();
    });
  });

  describe('findCurrentByCaregiverIds', () => {
    it('queries active assignments for the requested caregiver ids', async () => {
      const secondCaregiverId = '000000000000000000000003';
      const findMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: { toString: () => '0000000000000000000000a1' },
            caregiverId: { toString: () => CGV_ID },
            communityHallId: { toString: () => HALL_ID },
            validFrom: new Date('2025-01-01'),
            validTo: null,
          },
        ]),
      });
      const repo = new CaregiverHallAssignmentMongoRepository(
        makeModel({ find: findMock }) as any,
      );

      const result = await repo.findCurrentByCaregiverIds([
        CGV_ID,
        secondCaregiverId,
      ]);

      const query = findMock.mock.calls[0][0];
      expect(query.validTo).toBeNull();
      expect(query.caregiverId.$in.map((id: { toString: () => string }) => id.toString())).toEqual([
        CGV_ID,
        secondCaregiverId,
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].caregiverId).toBe(CGV_ID);
      expect(result[0].communityHallId).toBe(HALL_ID);
    });

    it('short-circuits empty caregiver id lists without querying Mongo', async () => {
      const findMock = jest.fn();
      const repo = new CaregiverHallAssignmentMongoRepository(
        makeModel({ find: findMock }) as any,
      );

      const result = await repo.findCurrentByCaregiverIds([]);

      expect(result).toEqual([]);
      expect(findMock).not.toHaveBeenCalled();
    });
  });
});
