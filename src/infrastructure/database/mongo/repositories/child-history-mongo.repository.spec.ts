import { ChildHistoryMongoRepository } from './child-history-mongo.repository';
import { ChildHistory } from 'src/domain/entities/child-history.entity';

describe('ChildHistoryMongoRepository', () => {
  const makeModel = (createFn: jest.Mock) => ({
    create: createFn,
  });

  const baseSnapshot = ChildHistory.create({
    originalId: '507f1f77bcf86cd799439011',
    documentNumber: '12345678',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    fullName: 'Maria Gonzalez',
    birthday: new Date('2018-03-10'),
    admissionDate: new Date('2022-07-01'),
    birthdayImported: null,
    admissionDateImported: null,
    communityHallId: '507f1f77bcf86cd799439012',
    communityHallLocalId: 'LOC001',
    communityHallName: 'Sala Los Pinos',
    userId: '507f1f77bcf86cd799439013',
    gender: 'F',
    childCode: 'CH-001',
    managementCommitteCode: 'CG001',
    managementCommitteName: 'Comité Central',
    snapshotDate: new Date('2026-05-01T10:00:00.000Z'),
    reason: 'committee_change',
  });

  describe('save', () => {
    it('should call model.create with mapped fields', async () => {
      const createMock = jest.fn().mockResolvedValue({ _id: { toString: () => 'new-id' } });
      const repo = new ChildHistoryMongoRepository(makeModel(createMock) as any);

      await repo.save(baseSnapshot);

      expect(createMock).toHaveBeenCalledTimes(1);
      const callArg = createMock.mock.calls[0][0];
      expect(callArg.documentNumber).toBe('12345678');
      expect(callArg.reason).toBe('committee_change');
      expect(callArg.snapshotDate).toEqual(new Date('2026-05-01T10:00:00.000Z'));
    });

    it('should return void (append-only — no return value needed)', async () => {
      const createMock = jest.fn().mockResolvedValue({});
      const repo = new ChildHistoryMongoRepository(makeModel(createMock) as any);

      const result = await repo.save(baseSnapshot);

      expect(result).toBeUndefined();
    });
  });
});
