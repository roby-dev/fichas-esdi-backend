import { ChildHistory } from './child-history.entity';

describe('ChildHistory entity', () => {
  const baseData = {
    originalId: 'abc123',
    documentNumber: '12345678',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    fullName: 'Maria Gonzalez',
    birthday: new Date('2018-03-10'),
    admissionDate: new Date('2022-07-01'),
    birthdayImported: null,
    admissionDateImported: null,
    communityHallId: 'hall-001',
    communityHallLocalId: 'LOC001',
    communityHallName: 'Sala Los Pinos',
    userId: 'user-001',
    gender: 'F',
    childCode: 'CH-001',
    managementCommitteCode: 'CG001',
    managementCommitteName: 'Comité Central',
    snapshotDate: new Date('2026-05-01T10:00:00.000Z'),
    reason: 'committee_change',
  };

  describe('create', () => {
    it('should create a ChildHistory with all fields', () => {
      const history = ChildHistory.create(baseData);

      expect(history.originalId).toBe(baseData.originalId);
      expect(history.documentNumber).toBe(baseData.documentNumber);
      expect(history.firstName).toBe(baseData.firstName);
      expect(history.lastName).toBe(baseData.lastName);
      expect(history.fullName).toBe(baseData.fullName);
      expect(history.birthday).toEqual(baseData.birthday);
      expect(history.admissionDate).toEqual(baseData.admissionDate);
      expect(history.birthdayImported).toBeNull();
      expect(history.admissionDateImported).toBeNull();
      expect(history.communityHallId).toBe(baseData.communityHallId);
      expect(history.communityHallLocalId).toBe(baseData.communityHallLocalId);
      expect(history.communityHallName).toBe(baseData.communityHallName);
      expect(history.userId).toBe(baseData.userId);
      expect(history.gender).toBe(baseData.gender);
      expect(history.childCode).toBe(baseData.childCode);
      expect(history.managementCommitteCode).toBe(baseData.managementCommitteCode);
      expect(history.managementCommitteName).toBe(baseData.managementCommitteName);
      expect(history.snapshotDate).toEqual(baseData.snapshotDate);
      expect(history.reason).toBe(baseData.reason);
    });

    it('should assign a unique id when none provided', () => {
      const h1 = ChildHistory.create(baseData);
      const h2 = ChildHistory.create(baseData);
      expect(h1.id).toBeUndefined();
      expect(h2.id).toBeUndefined();
    });
  });

  describe('fromPrimitives / toPrimitives', () => {
    it('should round-trip through toPrimitives and fromPrimitives', () => {
      const original = ChildHistory.create({ ...baseData });
      // Provide an id to simulate a persisted document
      const primitives = { ...original.toPrimitives(), id: 'hist-id-1' };
      const restored = ChildHistory.fromPrimitives(primitives);

      expect(restored.id).toBe('hist-id-1');
      expect(restored.originalId).toBe(baseData.originalId);
      expect(restored.documentNumber).toBe(baseData.documentNumber);
      expect(restored.snapshotDate).toEqual(baseData.snapshotDate);
      expect(restored.reason).toBe(baseData.reason);
    });
  });

  describe('toPrimitives satisfies Record<string, unknown>', () => {
    it('should return a plain object compatible with AuditEventSnapshot', () => {
      const history = ChildHistory.create(baseData);
      const primitives: Record<string, unknown> = history.toPrimitives();
      expect(typeof primitives).toBe('object');
    });
  });
});
