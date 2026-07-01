import { CaregiverMother } from './caregiver-mother.entity';

describe('CaregiverMother Entity', () => {
  describe('create', () => {
    it('creates an active caregiver with normalized identity', () => {
      const caregiver = CaregiverMother.create({
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        phone: '999888777',
        startDate: new Date('2025-01-01'),
      });

      expect(caregiver.documentType).toBe('DNI');
      expect(caregiver.documentNumber).toBe('12345678');
      expect(caregiver.fullName).toBe('MARIA GONZALEZ');
      expect(caregiver.status).toBe('active');
      expect(caregiver.isActiveOn(new Date('2025-06-01'))).toBe(true);
    });

    it('defaults status to active when omitted', () => {
      const caregiver = CaregiverMother.create({
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        startDate: new Date('2025-01-01'),
      });

      expect(caregiver.status).toBe('active');
    });
  });

  describe('isActiveOn', () => {
    it('returns false before startDate', () => {
      const caregiver = CaregiverMother.create({
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        startDate: new Date('2025-02-01'),
      });

      expect(caregiver.isActiveOn(new Date('2025-01-15'))).toBe(false);
    });

    it('returns false after endDate', () => {
      const caregiver = CaregiverMother.create({
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
      });

      expect(caregiver.isActiveOn(new Date('2025-04-01'))).toBe(false);
    });

    it('returns false when status is retired', () => {
      const caregiver = CaregiverMother.create({
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        startDate: new Date('2025-01-01'),
        status: 'retired',
      });

      expect(caregiver.isActiveOn(new Date('2025-06-01'))).toBe(false);
    });
  });

  describe('identityKey', () => {
    it('returns a composite key for uniqueness checks', () => {
      const caregiver = CaregiverMother.create({
        documentType: 'DNI',
        documentNumber: '12345678',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        startDate: new Date('2025-01-01'),
      });

      expect(caregiver.identityKey).toBe('DNI:12345678');
    });
  });

  describe('fromPrimitives / toPrimitives', () => {
    it('round-trips all fields', () => {
      const caregiver = CaregiverMother.fromPrimitives({
        id: 'cgv-1',
        documentType: 'CE',
        documentNumber: '123456',
        firstName: 'Ana',
        lastName: 'Lopez',
        phone: '555444333',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-06-01'),
        status: 'retired',
      });

      const primitives = caregiver.toPrimitives();
      expect(primitives.id).toBe('cgv-1');
      expect(primitives.documentType).toBe('CE');
      expect(primitives.documentNumber).toBe('123456');
      expect(primitives.fullName).toBe('ANA LOPEZ');
      expect(primitives.status).toBe('retired');
    });
  });
});
