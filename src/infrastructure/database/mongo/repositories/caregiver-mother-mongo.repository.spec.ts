import { CaregiverMotherMongoRepository } from './caregiver-mother-mongo.repository';
import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';

describe('CaregiverMotherMongoRepository', () => {
  const makeModel = (createFn: jest.Mock) => ({ create: createFn });

  const baseCaregiver = CaregiverMother.create({
    documentType: 'DNI',
    documentNumber: '12345678',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    phone: '999888777',
    startDate: new Date('2025-01-01'),
  });

  describe('save', () => {
    it('maps the domain entity to a Mongo document', async () => {
      const createMock = jest.fn().mockResolvedValue({
        _id: { toString: () => 'cgv-1' },
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'MARIA',
        lastName: 'GONZALEZ',
        fullName: 'MARIA GONZALEZ',
        phone: '999888777',
        startDate: new Date('2025-01-01'),
        endDate: null,
        status: 'active',
      });
      const repo = new CaregiverMotherMongoRepository(
        makeModel(createMock) as any,
      );

      await repo.save(baseCaregiver);

      expect(createMock).toHaveBeenCalledTimes(1);
      const doc = createMock.mock.calls[0][0];
      expect(doc.documentType).toBe('DNI');
      expect(doc.documentNumber).toBe('12345678');
      expect(doc.fullName).toBe('MARIA GONZALEZ');
      expect(doc.status).toBe('active');
    });

    it('returns the saved domain entity with an id', async () => {
      const createMock = jest.fn().mockResolvedValue({
        _id: { toString: () => 'cgv-1' },
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'MARIA',
        lastName: 'GONZALEZ',
        fullName: 'MARIA GONZALEZ',
        phone: '999888777',
        startDate: new Date('2025-01-01'),
        endDate: null,
        status: 'active',
      });
      const repo = new CaregiverMotherMongoRepository(
        makeModel(createMock) as any,
      );

      const result = await repo.save(baseCaregiver);

      expect(result.id).toBe('cgv-1');
      expect(result.identityKey).toBe('DNI:12345678');
    });
  });
});
